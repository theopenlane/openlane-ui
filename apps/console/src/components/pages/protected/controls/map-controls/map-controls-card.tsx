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
import { MapControl } from '@/types'
import { ControlType, SubcontrolType } from '@repo/codegen/src/type-names'

interface Props {
  title: 'From' | 'To'
  setExpandedCard: () => void
  expandedCard: string
  presetControls?: MapControl[]
  droppedControls: MapControl[]
  setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>
  oppositeControls: MapControl[]
}

const MapControlsCard: React.FC<Props> = ({ title, setExpandedCard, expandedCard, presetControls, droppedControls, setDroppedControls, oppositeControls }) => {
  const [where, setWhere] = useState<ControlWhereInput | SubcontrolWhereInput>({})
  const [enableSubcontrols, setEnableSubcontrols] = useState(false)
  const { setValue, getValues } = useFormContext<MapControlsFormData>()

  const hasFilters = Object.keys(where).length > 0

  const subcontrolEnabled = hasFilters && enableSubcontrols

  const allControls = useAllControlsGrouped({ where: { ownerIDNEQ: '', ...where } as ControlWhereInput, enabled: hasFilters })
  const allSubcontrols = useAllSubcontrolsGrouped({ where: { ownerIDNEQ: '', ...where } as SubcontrolWhereInput, enabled: subcontrolEnabled })

  const queriesLoading = allControls.isLoading || allSubcontrols.isLoading

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    try {
      const payload: MapControl[] = JSON.parse(e.dataTransfer.getData('application/json'))

      if (!Array.isArray(payload) || payload.length === 0) return

      const isFrom = title === 'From'
      const controlField = isFrom ? 'fromControlIDs' : 'toControlIDs'
      const subcontrolField = isFrom ? 'fromSubcontrolIDs' : 'toSubcontrolIDs'

      const controlIds = getValues(controlField) || []
      const subcontrolIds = getValues(subcontrolField) || []

      const existingIds = new Set(droppedControls.map((c) => c.id))

      const newControls = payload.filter((item) => !existingIds.has(item.id))

      if (newControls.length === 0) return

      setDroppedControls((prev) => [...prev, ...newControls])
      const newControlIds = newControls
        .filter((item) => item.__typename === ControlType)
        .map((item) => item.id)
        .filter((id) => !controlIds.includes(id))

      const newSubcontrolIds = newControls
        .filter((item) => item.__typename === SubcontrolType)
        .map((item) => item.id)
        .filter((id) => !subcontrolIds.includes(id))

      if (newControlIds.length > 0) {
        setValue(controlField, [...controlIds, ...newControlIds])
      }

      if (newSubcontrolIds.length > 0) {
        setValue(subcontrolField, [...subcontrolIds, ...newSubcontrolIds])
      }
    } catch (err) {
      console.error('Invalid drop payload', err)
    }
  }

  const handleRemove = (control: MapControl) => {
    const isFrom = title === 'From'
    const controlField = isFrom ? 'fromControlIDs' : 'toControlIDs'
    const subcontrolField = isFrom ? 'fromSubcontrolIDs' : 'toSubcontrolIDs'
    setDroppedControls((prev) => prev.filter((c) => c.id !== control.id))

    if (control.__typename === ControlType) {
      const ids = getValues(controlField) || []
      setValue(
        controlField,
        ids.filter((i: string) => i !== control.id),
      )
    } else if (control.__typename === SubcontrolType) {
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
  }, [presetControls, setDroppedControls])

  return (
    <Card className="p-4">
      <AccordionItem value={title}>
        <AccordionTrigger asChild className="bg-unset">
          <button className="group flex w-full justify-between items-center" onClick={setExpandedCard}>
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex gap-2 items-center">
                <h3 className="text-base font-medium text-xl">{title}</h3>
                {expandedCard !== title && (
                  <div className="flex gap-1 flex-wrap items-center">
                    {droppedControls.slice(0, 5).map((control) => (
                      <ControlChip key={control.id} control={control} className="rounded-md" clickable={false} />
                    ))}
                    {droppedControls.length > 5 && <span className="text-sm ml-2">+{droppedControls.length - 5} more</span>}
                  </div>
                )}
              </div>
              <ChevronDown
                size={22}
                className="
                  transform
                  -rotate-90
                  transition-transform
                  group-data-[state=open]:rotate-0
                  text-brand shrink-0
                "
              />
            </div>
          </button>
        </AccordionTrigger>
        <AccordionContent>
          {expandedCard === title && (
            <CardContent className="grid grid-cols-[2fr_325px] gap-x-8 p-0 mt-5">
              <div>
                <MapControlsFormFilters enableSubcontrols={enableSubcontrols} setEnableSubcontrols={setEnableSubcontrols} onFilterChange={setWhere} oppositeControls={oppositeControls} />
                <MatchedControls
                  isLoading={queriesLoading}
                  where={where}
                  controlData={allControls?.allControls}
                  subcontrolData={subcontrolEnabled ? allSubcontrols.allSubcontrols : undefined}
                  droppedControls={droppedControls}
                  title={title}
                  setDroppedControls={setDroppedControls}
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
                        clickable={false}
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
