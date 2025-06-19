import { GetControlSelectOptionsQuery, GetSubcontrolSelectOptionsQuery } from '@repo/codegen/src/schema'
import React, { useMemo } from 'react'
import { DroppedControl } from './map-controls-card'
import ControlChip from './shared/control-chip'

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
  subcontrolData?: GetSubcontrolSelectOptionsQuery
}

const MapControlResults = ({ controlData, droppedControls, subcontrolData }: Props) => {
  const droppedIds = useMemo(() => droppedControls.map((dc) => dc.id), [droppedControls])

  // const availableControls = useMemo(() => {
  //   // const controlNodes =
  //   //   controlData?.controls?.edges
  //   //     ?.map((edge) => edge?.node)
  //   //     .filter((node): node is NonNullable<typeof node> => !!node)
  //   //     .map((node) => ({ ...node, type: 'control' as const })) || []

  //   const subcontrolNodes =
  //     subcontrolData?.subcontrols?.edges
  //       ?.map((edge) => edge?.node)
  //       .filter((node): node is NonNullable<typeof node> => !!node)
  //       .map((node) => ({ ...node, type: 'subcontrol' as const })) || []

  //   return [...controlNodes, ...subcontrolNodes].filter((node) => !droppedIds.includes(node.id))
  // }, [controlData, subcontrolData, droppedIds])

  return (
    <div className="my-3 flex flex-wrap gap-2">
      {controlData && controlData.length > 0 ? (
        controlData.map((control) => (
          <ControlChip
            key={control?.id}
            draggable
            control={{
              id: control?.id ?? '',
              refCode: control?.refCode ?? '',
              shortName: control?.referenceFramework || 'CUSTOM',
              type: control?.__typename === 'Control' ? 'control' : 'subcontrol',
            }}
            onDragStart={(e) =>
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({
                  id: control?.id,
                  refCode: control?.refCode,
                  shortName: control?.referenceFramework || 'CUSTOM',
                  type: control?.__typename === 'Control' ? 'control' : 'subcontrol',
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
