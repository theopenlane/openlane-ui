'use client'
import React, { useCallback, useEffect, useState } from 'react'

import { Accordion } from '@radix-ui/react-accordion'

import { FormProvider, useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MappedControlMappingType,
  MappedControlMappingSource,
  UpdateMappedControlMutationVariables,
  UpdateMappedControlInput,
  GetMappedControlByIdQuery,
  ControlEdge,
  SubcontrolEdge,
} from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useGetMappedControlById, useUpdateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import MapControlsCard from '../map-controls/map-controls-card'
import { MapControlsFormData, mapControlsSchema } from '../map-controls/use-form-schema'
import MapControlsRelations from '../map-controls/map-controls-relations'
import { useQueryClient } from '@tanstack/react-query'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import { MapControl } from '@/types'
import { useOrganization } from '@/hooks/useOrganization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const EditMapControlPage = () => {
  const { id, subcontrolId } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { errorNotification, successNotification } = useNotification()
  const mappedControlId = searchParams.get('mappedControlId')
  const [expandedCard, setExpandedCard] = useState<'From' | 'To' | ''>('From')
  const [presetControlsFrom, setPresetControlsFrom] = useState<MapControl[]>([])
  const [presetControlsTo, setPresetControlsTo] = useState<MapControl[]>([])
  const [droppedControlsFrom, setDroppedControlsFrom] = useState<MapControl[]>([])
  const [droppedControlsTo, setDroppedControlsTo] = useState<MapControl[]>([])
  const { mutateAsync: update, data: updateData, isPending } = useUpdateMappedControl()

  const isControl = !subcontrolId && !!id
  const isSubControl = !!subcontrolId
  const { data: controlData, isLoading } = useGetControlById(isControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(isSubControl ? (subcontrolId as string) : null)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

  const { data: mappedControlData } = useGetMappedControlById({ mappedControlId: mappedControlId ?? '', enabled: !!mappedControlId && !updateData && !isPending })

  const handleCardToggle = (title: 'From' | 'To') => {
    if (expandedCard === title) {
      setExpandedCard('')
    } else {
      setExpandedCard(title)
    }
  }

  const form = useForm<MapControlsFormData>({
    resolver: zodResolver(mapControlsSchema) as Resolver<MapControlsFormData>,
    defaultValues: {
      mappingType: MappedControlMappingType.PARTIAL,
      source: MappedControlMappingSource.MANUAL,
      confidence: 0,
    },
  })

  const mappingType = useWatch({
    control: form.control,
    name: 'mappingType',
  })

  const generateUpdateMappedControlInput = (data: MapControlsFormData, existing: GetMappedControlByIdQuery['mappedControl'] | undefined): UpdateMappedControlInput => {
    const getEdgeIDs = (edges?: ControlEdge[] | SubcontrolEdge[]) => edges?.map((e) => e?.node?.id || '').filter(Boolean) ?? []

    const currentFromControlIDs = getEdgeIDs(existing?.fromControls?.edges as ControlEdge[])
    const currentToControlIDs = getEdgeIDs(existing?.toControls?.edges as ControlEdge[])
    const currentFromSubcontrolIDs = getEdgeIDs(existing?.fromSubcontrols?.edges as SubcontrolEdge[])
    const currentToSubcontrolIDs = getEdgeIDs(existing?.toSubcontrols?.edges as SubcontrolEdge[])

    const computeDelta = (current: string[], updated: string[]) => {
      const add = updated.filter((id) => !current.includes(id))
      const remove = current.filter((id) => !updated.includes(id))
      return { add, remove }
    }

    const fromControlDelta = computeDelta(currentFromControlIDs, data.fromControlIDs ?? [])
    const toControlDelta = computeDelta(currentToControlIDs, data.toControlIDs ?? [])
    const fromSubcontrolDelta = computeDelta(currentFromSubcontrolIDs, data.fromSubcontrolIDs ?? [])
    const toSubcontrolDelta = computeDelta(currentToSubcontrolIDs, data.toSubcontrolIDs ?? [])

    const input: UpdateMappedControlInput = {
      addFromControlIDs: fromControlDelta.add,
      removeFromControlIDs: fromControlDelta.remove,
      addToControlIDs: toControlDelta.add,
      removeToControlIDs: toControlDelta.remove,
      addFromSubcontrolIDs: fromSubcontrolDelta.add,
      removeFromSubcontrolIDs: fromSubcontrolDelta.remove,
      addToSubcontrolIDs: toSubcontrolDelta.add,
      removeToSubcontrolIDs: toSubcontrolDelta.remove,
      mappingType: data.mappingType,
      source: data.source,
      confidence: data.confidence,
      relation: data.relation,
    }

    return input
  }

  const onSubmit = async (data: MapControlsFormData) => {
    const hasFrom = (!!data.fromControlIDs && data.fromControlIDs.length > 0) || (!!data.fromSubcontrolIDs && data.fromSubcontrolIDs.length > 0)
    const hasTo = (!!data.toControlIDs && data.toControlIDs.length > 0) || (!!data.toSubcontrolIDs && data.toSubcontrolIDs.length > 0)

    if (!hasFrom) {
      errorNotification({ title: 'From control is required' })
      return
    }
    if (!hasTo) {
      errorNotification({ title: 'To control is required' })
      return
    }

    if (!mappedControlId) {
      return
    }

    const input = generateUpdateMappedControlInput(data, mappedControlData?.mappedControl)

    const variables: UpdateMappedControlMutationVariables = {
      updateMappedControlId: mappedControlId,
      input,
    }

    try {
      {
        await update(variables)
        successNotification({ title: 'Map Control updated!' })
        const redirectUrl = subcontrolId ? `/controls/${id}/${subcontrolId}?openRelations=true` : `/controls/${id}?openRelations=true`
        router.push(redirectUrl)
        queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const setControlsCrumbs = useCallback(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: controlData?.control?.refCode, isLoading: isLoading, href: `/controls/${id}` },
      { label: 'Edit Map Control' },
    ])
  }, [controlData?.control?.refCode, isLoading, setCrumbs, id])

  const setSubControlsCrumbs = useCallback(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: subcontrolData?.subcontrol?.refCode, isLoading: isLoading, href: `/controls/${id}/${subcontrolId}` },
      { label: 'Edit Map Control' },
    ])
  }, [isLoading, setCrumbs, subcontrolData?.subcontrol?.refCode, id, subcontrolId])

  useEffect(() => {
    if (controlData) {
      setControlsCrumbs()
    }

    if (subcontrolData) {
      setSubControlsCrumbs()
    }

    if (mappedControlId && mappedControlData?.mappedControl) {
      const mc = mappedControlData.mappedControl

      const fromControlIDs = mc.fromControls?.edges?.map((e) => e?.node?.id || '').filter(Boolean) || []
      const toControlIDs = mc.toControls?.edges?.map((e) => e?.node?.id || '').filter(Boolean) || []
      const fromSubcontrolIDs = mc.fromSubcontrols?.edges?.map((e) => e?.node?.id || '').filter(Boolean) || []
      const toSubcontrolIDs = mc.toSubcontrols?.edges?.map((e) => e?.node?.id || '').filter(Boolean) || []

      form.reset({
        fromControlIDs,
        toControlIDs,
        fromSubcontrolIDs,
        toSubcontrolIDs,
        confidence: mc.confidence ?? undefined,
        mappingType: mc.mappingType ?? MappedControlMappingType.PARTIAL,
        relation: mc.relation ?? '',
        source: mc.source ?? MappedControlMappingSource.MANUAL,
      })

      const presetFrom: MapControl[] = []
      const presetTo: MapControl[] = []

      mc.fromControls?.edges?.forEach((e) => {
        if (e?.node) {
          presetFrom.push(e.node)
        }
      })

      mc.fromSubcontrols?.edges?.forEach((e) => {
        if (e?.node) {
          presetFrom.push(e.node)
        }
      })

      mc.toControls?.edges?.forEach((e) => {
        if (e?.node) {
          presetTo.push(e.node)
        }
      })

      mc.toSubcontrols?.edges?.forEach((e) => {
        if (e?.node) {
          presetTo.push(e.node)
        }
      })

      setPresetControlsFrom(presetFrom)
      setPresetControlsTo(presetTo)
    }
  }, [setCrumbs, controlData, subcontrolData, form, isLoading, isLoadingSubcontrol, setControlsCrumbs, setSubControlsCrumbs, mappedControlId, mappedControlData])

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${isSubControl ? subcontrolData?.subcontrol?.refCode : controlData?.control?.refCode}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-6">
          <SlideBarLayout sidebarContent={<MapControlsRelations />}>
            <div className="p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Map Controls</h1>
                <p
                  className="text
            -muted-foreground mt-1"
                >
                  Define how controls relate across frameworks – custom sets—whether they’re equivalent, overlapping, or one is a subset of another. Use these mappings to reduce duplication, surface
                  gaps, and create a unified view of your compliance posture.
                </p>
              </div>
              <div className="flex flex-col">
                <Accordion type="single" collapsible value={expandedCard} className="w-full">
                  <MapControlsCard
                    title="From"
                    expandedCard={expandedCard}
                    setExpandedCard={() => handleCardToggle('From')}
                    presetControls={presetControlsFrom}
                    droppedControls={droppedControlsFrom}
                    setDroppedControls={setDroppedControlsFrom}
                    oppositeControls={droppedControlsTo}
                  />
                  <div className="flex flex-col items-center">
                    <div className="border-l h-4" />
                    <div className="h-12 w-12 bg-card flex items-center justify-center rounded-full">{MappingIconMapper[mappingType]}</div>
                    <div className="border-l h-4" />
                  </div>
                  <MapControlsCard
                    title="To"
                    expandedCard={expandedCard}
                    setExpandedCard={() => handleCardToggle('To')}
                    presetControls={presetControlsTo}
                    droppedControls={droppedControlsTo}
                    setDroppedControls={setDroppedControlsTo}
                    oppositeControls={droppedControlsFrom}
                  />
                </Accordion>
              </div>
            </div>
          </SlideBarLayout>
        </form>
      </FormProvider>{' '}
    </>
  )
}

export default EditMapControlPage
