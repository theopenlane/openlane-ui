'use client'
import React, { useEffect, useState } from 'react'

import Intersection from '@/assets/Intersection'
import MapControlsCard, { DroppedControl } from '@/components/pages/protected/map-controls/map-controls-card'
import MapControlsRelations from '@/components/pages/protected/map-controls/map-controls-relations'
import { Accordion } from '@radix-ui/react-accordion'
import Subset from '@/assets/Subset'
import Equals from '@/assets/Equals'
import Partial from '@/assets/Partial'
import SupersetDark from '@/assets/SupersetDark'
import SupersetLight from '@/assets/SupersetLight '
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { MapControlsFormData, mapControlsSchema } from '@/components/pages/protected/map-controls/use-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { MappedControlMappingType, MappedControlMappingSource } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useParams } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const MapControlPage = () => {
  const [expandedCard, setExpandedCard] = useState<'From' | 'To' | ''>('From')
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: create } = useCreateMappedControl()

  const { id, subcontrolId } = useParams()

  const shouldFetchControl = !subcontrolId && !!id
  const shouldFetchSubcontrol = !!subcontrolId

  const { data: controlData, isLoading } = useGetControlById(shouldFetchControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(shouldFetchSubcontrol ? (subcontrolId as string) : null)
  const [presetControl, setPresetControl] = useState<DroppedControl>()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
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

  const MappingIcon = ({ type }: { type: MappedControlMappingType }) => {
    switch (type) {
      case MappedControlMappingType.EQUAL:
        return <Equals />
      case MappedControlMappingType.INTERSECT:
        return <Intersection />
      case MappedControlMappingType.SUBSET:
        return <Subset />
      case MappedControlMappingType.PARTIAL:
        return <Partial />
      case MappedControlMappingType.SUPERSET:
        return (
          <>
            <div className="block dark:hidden">
              <SupersetLight />
            </div>
            <div className="hidden dark:block">
              <SupersetDark />
            </div>
          </>
        )
      default:
        return null
    }
  }

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
    } catch {
      errorNotification({ title: 'Unable to create control mapping, please try again later' })
    }
  }

  const setControlsCrumbs = () => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: controlData?.control?.refCode, isLoading: isLoading },
      { label: 'Map Controls', href: '/map-control' },
    ])
  }

  const setSubControlsCrumbs = () => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
      { label: subcontrolData?.subcontrol?.refCode, isLoading: isLoading },
      { label: 'Map Controls', href: '/map-control' },
    ])
  }

  useEffect(() => {
    if (controlData) {
      setControlsCrumbs()
      form.setValue('fromControlIDs', [controlData.control.id])
      setPresetControl({ id: controlData.control.id, refCode: controlData.control.refCode, shortName: controlData.control.standard?.shortName || 'CUSTOM', type: 'control' })
    }
    if (subcontrolData) {
      setSubControlsCrumbs()
      form.setValue('fromSubcontrolIDs', [subcontrolData.subcontrol.id])
      setPresetControl({
        id: subcontrolData.subcontrol.id,
        refCode: subcontrolData.subcontrol.refCode,
        shortName: subcontrolData.subcontrol.control.standard?.shortName || 'CUSTOM',
        type: 'subcontrol',
      })
    }
  }, [setCrumbs, controlData, subcontrolData, form, isLoading, isLoadingSubcontrol])

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-6">
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Map Controls</h1>
            <p
              className="text
            -muted-foreground mt-1"
            >
              Define how controls relate across frameworks – custom sets—whether they’re equivalent, overlapping, or one is a subset of another. Use these mappings to reduce duplication, surface gaps,
              and create a unified view of your compliance posture.
            </p>
          </div>
          <div className="grid grid-cols-[3fr_1fr] gap-6">
            <div className="flex flex-col">
              <Accordion type="single" collapsible value={expandedCard} className="w-full">
                <MapControlsCard title="From" expandedCard={expandedCard} setExpandedCard={() => handleCardToggle('From')} presetControl={presetControl} />
                <div className="flex flex-col items-center">
                  <div className="border-l h-4" />
                  <div className="h-12 w-12 bg-card flex items-center justify-center rounded-full">
                    <MappingIcon type={mappingType} />
                  </div>
                  <div className="border-l h-4" />
                </div>
                <MapControlsCard title="To" expandedCard={expandedCard} setExpandedCard={() => handleCardToggle('To')} />
              </Accordion>
            </div>
            <MapControlsRelations />
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

export default MapControlPage
