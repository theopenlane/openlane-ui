import { GetControlSelectOptionsQuery, GetSubcontrolSelectOptionsQuery } from '@repo/codegen/src/schema'
import React, { useMemo } from 'react'
import { DroppedControl } from './map-controls-card'
import ControlChip from './shared/control-chip'

interface Props {
  controlData?: GetControlSelectOptionsQuery
  droppedControls: DroppedControl[]
  subcontrolData?: GetSubcontrolSelectOptionsQuery
}

const MapControlResults = ({ controlData, droppedControls, subcontrolData }: Props) => {
  const droppedIds = useMemo(() => droppedControls.map((dc) => dc.id), [droppedControls])

  const availableControls = useMemo(() => {
    const controlNodes =
      controlData?.controls?.edges
        ?.map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => !!node)
        .map((node) => ({ ...node, type: 'control' as const })) || []

    const subcontrolNodes =
      subcontrolData?.subcontrols?.edges
        ?.map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => !!node)
        .map((node) => ({ ...node, type: 'subcontrol' as const })) || []

    return [...controlNodes, ...subcontrolNodes].filter((node) => !droppedIds.includes(node.id))
  }, [controlData, subcontrolData, droppedIds])

  return (
    <div className="my-3 flex flex-wrap gap-2">
      {availableControls.length > 0 ? (
        availableControls.map((control) => (
          <ControlChip
            key={control.id}
            draggable
            control={{
              id: control.id,
              refCode: control.refCode,
              shortName: control.referenceFramework || 'CUSTOM',
              type: control.type,
            }}
            onDragStart={(e) =>
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                  id: control.id,
                  refCode: control.refCode,
                  shortName: control.referenceFramework || 'CUSTOM',
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
