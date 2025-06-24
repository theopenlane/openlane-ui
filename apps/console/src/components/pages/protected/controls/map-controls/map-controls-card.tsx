import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import MapControlsFormFilters from './map-controls-form-filters'
import MatchedControls from './matched-controls'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, Expand } from 'lucide-react'
import { useAllControlsGrouped } from '@/lib/graphql-hooks/controls'

import ControlChip from './shared/control-chip'
import { ControlWhereInput, SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useAllSubcontrolsGrouped } from '@/lib/graphql-hooks/subcontrol'
import { useFormContext } from 'react-hook-form'
import { MapControlsFormData } from './use-form-schema'

export interface DroppedControl {
  id: string
  refCode: string
  shortName: string
  type: 'control' | 'subcontrol'
}

interface Props {
  title: 'From' | 'To'
  setExpandedCard: () => void
  expandedCard: string
  presetControls?: DroppedControl[]
}

const MapControlsCard: React.FC<Props> = ({ title, setExpandedCard, expandedCard, presetControls }) => {
  const [where, setWhere] = useState<ControlWhereInput | SubcontrolWhereInput>({})
  const [droppedControls, setDroppedControls] = useState<DroppedControl[]>([])
  const [enableSubcontrols, setEnableSubcontrols] = useState(false)
  const { setValue, getValues } = useFormContext<MapControlsFormData>()

  const hasFilters = Object.keys(where).length > 0

  const subcontrolEnabled = hasFilters && enableSubcontrols

  const allControls = useAllControlsGrouped({ where: where as ControlWhereInput, enabled: hasFilters })
  const allSubcontrols = useAllSubcontrolsGrouped({ where: where as SubcontrolWhereInput, enabled: subcontrolEnabled })

  const queriesLoading = allControls.isLoading || allSubcontrols.isLoading

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'))

      if (!payload?.id || !payload?.refCode || !payload?.type) return

      if (droppedControls.find((c) => c.id === payload.id)) return

      setDroppedControls((prev) => [...prev, payload])

      const isFrom = title === 'From'
      const controlField = isFrom ? 'fromControlIDs' : 'toControlIDs'
      const subcontrolField = isFrom ? 'fromSubcontrolIDs' : 'toSubcontrolIDs'

      const controlIds = getValues(controlField) || []
      const subcontrolIds = getValues(subcontrolField) || []

      if (payload.type === 'control') {
        setValue(controlField, [...controlIds, payload.id])
      } else if (payload.type === 'subcontrol') {
        setValue(subcontrolField, [...subcontrolIds, payload.id])
      }
    } catch (err) {
      console.error('Invalid drop payload', err)
    }
  }

  const handleRemove = (control: DroppedControl) => {
    const isFrom = title === 'From'
    const controlField = isFrom ? 'fromControlIDs' : 'toControlIDs'
    const subcontrolField = isFrom ? 'fromSubcontrolIDs' : 'toSubcontrolIDs'
    setDroppedControls((prev) => prev.filter((c) => c.id !== control.id))

    if (control.type === 'control') {
      const ids = getValues(controlField) || []
      setValue(
        controlField,
        ids.filter((i: string) => i !== control.id),
      )
    } else if (control.type === 'subcontrol') {
      const ids = getValues(subcontrolField) || []
      setValue(
        subcontrolField,
        ids.filter((i: string) => i !== control.id),
      )
    }
  }

  useEffect(() => {
    if (presetControls) {
      setDroppedControls([...presetControls])
    }
  }, [presetControls])

  return (
    <Card className="p-4">
      <AccordionItem value={title}>
        <AccordionTrigger asChild>
          <button className="group flex w-full justify-between items-center" onClick={setExpandedCard}>
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex gap-2 items-center">
                <h3 className="text-base font-medium text-xl">{title}</h3>
                {expandedCard !== title && droppedControls.map((control) => <ControlChip key={control.id} control={control} className="rounded-md cursor-default" />)}
              </div>
              <ChevronDown
                size={22}
                className="
                  transform
                  -rotate-90
                  transition-transform
                  group-data-[state=open]:rotate-0
                  text-brand
                "
              />
            </div>
          </button>
        </AccordionTrigger>
        <AccordionContent>
          {expandedCard === title && (
            <CardContent className="grid grid-cols-[2fr_325px] gap-x-8 p-0 mt-5">
              <div>
                <MapControlsFormFilters enableSubcontrols={enableSubcontrols} setEnableSubcontrols={setEnableSubcontrols} onFilterChange={setWhere} />
                <MatchedControls
                  isLoading={queriesLoading}
                  where={where}
                  controlData={allControls?.allControls}
                  subcontrolData={subcontrolEnabled ? allSubcontrols.allSubcontrols : undefined}
                  droppedControls={droppedControls}
                />
              </div>
              <div className="border-2 border-dashed rounded-lg flex items-center justify-center flex-col gap-2" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                {!droppedControls.length ? (
                  <>
                    <Expand size={42} strokeWidth={1} />
                    <p>Drag controls here</p>
                  </>
                ) : (
                  <div className="flex gap-2 flex-wrap justify-center">
                    {droppedControls.map((control) => (
                      <ControlChip
                        key={control.id}
                        control={control}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(control))}
                        onDragEnd={(e) => {
                          if (e.dataTransfer.dropEffect === 'none') handleRemove(control)
                        }}
                        removable
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </AccordionContent>
      </AccordionItem>
    </Card>
  )
}

export default MapControlsCard
