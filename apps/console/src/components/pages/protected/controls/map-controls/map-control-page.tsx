'use client'
import React, { useCallback, useEffect, useState } from 'react'

import { Accordion } from '@radix-ui/react-accordion'

import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MappedControlMappingType, MappedControlMappingSource } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useParams, useRouter } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import MapControlsCard from './map-controls-card'
import { MapControlsFormData, mapControlsSchema } from './use-form-schema'
import MapControlsRelations from './map-controls-relations'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import { MapControl } from '@/types'
import { useOrganization } from '@/hooks/useOrganization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const MapControlPage = () => {
  const [expandedCard, setExpandedCard] = useState<'From' | 'To' | ''>('To')
  const [presetControls, setPresetControls] = useState<MapControl[]>()
  const [droppedControlsFrom, setDroppedControlsFrom] = useState<MapControl[]>([])
  const [droppedControlsTo, setDroppedControlsTo] = useState<MapControl[]>([])

  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: create } = useCreateMappedControl()
  const { id, subcontrolId } = useParams()
  const isControl = !subcontrolId && !!id
  const isSubControl = !!subcontrolId
  const { data: controlData, isLoading } = useGetControlById(isControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(isSubControl ? (subcontrolId as string) : null)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const router = useRouter()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)

  const handleCardToggle = (title: 'From' | 'To') => {
    if (expandedCard === title) {
      setExpandedCard('')
    } else {
      setExpandedCard(title)
    }
  }

  const form = useForm<MapControlsFormData>({
    resolver: zodResolver(mapControlsSchema),
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

  const onSubmit = async (data: MapControlsFormData) => {
    const hasFrom = (!!data.fromControlIDs && !!data.fromControlIDs.length) || (!!data.fromSubcontrolIDs && !!data.fromSubcontrolIDs.length)
    const hasTo = (!!data.toControlIDs && !!data.toControlIDs.length) || (!!data.toSubcontrolIDs && !!data.toSubcontrolIDs.length)
    if (!hasFrom) {
      errorNotification({ title: 'From control is required' })
      return
    }
    if (!hasTo) {
      errorNotification({ title: 'To control is required' })
      return
    }
    try {
      await create({ input: data })
      successNotification({ title: 'Map Control created!' })
      router.back()
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
      { label: 'Create Map Control' },
    ])
  }, [controlData?.control?.refCode, isLoading, setCrumbs, id])

  const setSubControlsCrumbs = useCallback(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: subcontrolData?.subcontrol?.refCode, isLoading: isLoading, href: `/controls/${id}/${subcontrolId}` },
      { label: 'Create Map Control' },
    ])
  }, [isLoading, setCrumbs, subcontrolData?.subcontrol?.refCode, id, subcontrolId])

  useEffect(() => {
    if (controlData) {
      setControlsCrumbs()
      form.setValue('fromControlIDs', [controlData.control.id])
      setPresetControls([controlData.control])
    }
    if (subcontrolData) {
      setSubControlsCrumbs()
      form.setValue('fromSubcontrolIDs', [subcontrolData.subcontrol.id])
      setPresetControls([subcontrolData.subcontrol])
    }
  }, [setCrumbs, controlData, subcontrolData, form, isLoading, isLoadingSubcontrol, setControlsCrumbs, setSubControlsCrumbs])

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Controls - ${isSubControl ? subcontrolData?.subcontrol?.refCode : controlData?.control?.refCode}`}</title>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-6">
          <SlideBarLayout sidebarContent={<MapControlsRelations />}>
            <div className="p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Map Controls</h1>
                <p className="text-muted-foreground mt-1">
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
                    presetControls={presetControls}
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
                    droppedControls={droppedControlsTo}
                    setDroppedControls={setDroppedControlsTo}
                    oppositeControls={droppedControlsFrom}
                  />
                </Accordion>
              </div>
            </div>
          </SlideBarLayout>
        </form>
      </FormProvider>
    </>
  )
}

export default MapControlPage
