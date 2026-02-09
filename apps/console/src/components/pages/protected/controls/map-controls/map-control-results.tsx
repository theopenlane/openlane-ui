import React from 'react'
import ControlChip from './shared/control-chip'
import ContextMenu from '@/components/shared/context-menu/context-menu'
import { MapControl } from '@/types'
import { useMapControls } from './shared/use-selectable-controls'
import { ControlType, SubcontrolType } from '@repo/codegen/src/type-names'

interface Props {
  controlData?: (
    | {
        __typename?: typeof ControlType
        id: string
        refCode: string
        category?: string | null
        subcategory?: string | null
        referenceFramework?: string | null
      }
    | null
    | undefined
  )[]
  droppedControls: MapControl[]
  subcontrolData?: {
    __typename?: typeof SubcontrolType
    id: string
    refCode: string
    category?: string | null
    subcategory?: string | null
    referenceFramework?: string | null
  }[]
  title: 'From' | 'To'
  setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>
}

const MapControlResults = ({ controlData, droppedControls, subcontrolData, title, setDroppedControls }: Props) => {
  const { availableControls, selectedIds, setSelectedIds, contextMenu, setContextMenu, handleContextMenu, handleAddToMapping, createDragPreview } = useMapControls({
    controlData,
    subcontrolData,
    droppedControls,
    title,
  })

  return (
    <div className="my-3 flex flex-wrap gap-2">
      {availableControls.length > 0 ? (
        availableControls.map((control) => (
          <div key={control.id}>
            <ControlChip
              draggable
              clickable={false}
              control={control}
              onDragStart={(e) => {
                const isSelected = selectedIds.includes(control.id)
                const controlsToDrag: MapControl[] = isSelected ? availableControls.filter((c) => selectedIds.includes(c.id)) : [control]
                e.dataTransfer.setData('application/json', JSON.stringify(controlsToDrag))
                const dragPreview = createDragPreview(`${controlsToDrag.length} item${controlsToDrag.length > 1 ? 's' : ''}`)
                e.dataTransfer.setDragImage(dragPreview, 0, 0)
              }}
              selected={selectedIds.includes(control.id)}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  setSelectedIds((prev) => (prev.includes(control.id) ? prev.filter((id) => id !== control.id) : [...prev, control.id]))
                } else {
                  setSelectedIds([control.id])
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, control)}
            />
          </div>
        ))
      ) : (
        <div className="text-sm italic text-neutral-500">No available controls.</div>
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}>
          <button className="px-4 py-2  w-full text-left" onClick={() => handleAddToMapping(setDroppedControls)}>
            Add to Mapping
          </button>
        </ContextMenu>
      )}
    </div>
  )
}

export default MapControlResults
