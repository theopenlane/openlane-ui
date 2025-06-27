import React, { useMemo } from 'react'
import { DroppedControl } from './map-controls-card'
import ControlChip from './shared/control-chip'
import { useFormContext } from 'react-hook-form'

interface Props {
  controlData?: (
    | {
        __typename?: 'Control'
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }
    | null
    | undefined
  )[]
  droppedControls: DroppedControl[]
  subcontrolData:
    | {
        __typename?: 'Subcontrol'
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }[]
    | undefined
  title: 'From' | 'To'
}

const MapControlResults = ({ controlData, droppedControls, subcontrolData, title }: Props) => {
  const form = useFormContext()

  const availableControls = useMemo(() => {
    const oppositeControlIDs: string[] = form.getValues(title === 'From' ? 'toControlIDs' : 'fromControlIDs') || []
    const oppositeSubcontrolIDs: string[] = form.getValues(title === 'From' ? 'toSubcontrolIDs' : 'fromSubcontrolIDs') || []

    const droppedIds = droppedControls.map((dc) => dc.id)
    const excludeIds = new Set([...droppedIds, ...oppositeControlIDs, ...oppositeSubcontrolIDs])

    const controlNodes = controlData?.filter(Boolean).map((node) => ({ ...node!, type: 'control' as const })) || []

    const subcontrolNodes = subcontrolData?.filter(Boolean).map((node) => ({ ...node!, type: 'subcontrol' as const })) || []

    return [...controlNodes, ...subcontrolNodes].filter((node) => !excludeIds.has(node.id))
  }, [form, controlData, subcontrolData, droppedControls, title])

  return (
    <div className="my-3 flex flex-wrap gap-2">
      {availableControls && availableControls.length > 0 ? (
        availableControls.map((control) => (
          <ControlChip
            key={control?.id}
            draggable
            control={{
              id: control?.id ?? '',
              refCode: control?.refCode ?? '',
              shortName: control?.referenceFramework || 'CUSTOM',
              type: control.type,
            }}
            onDragStart={(e) =>
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                  id: control?.id,
                  refCode: control?.refCode,
                  shortName: control?.referenceFramework || 'CUSTOM',
                  type: control.type,
                }),
              )
            }
          />
        ))
      ) : (
        <div className="text-sm italic text-neutral-500">No available controls.</div>
      )}
    </div>
  )
}

export default MapControlResults
