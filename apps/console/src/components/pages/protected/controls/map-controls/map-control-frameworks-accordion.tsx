import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import ContextMenu from '@/components/shared/context-menu/context-menu'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { useMapControls } from './shared/use-selectable-controls'
import { MapControl } from '@/types'

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
  subcontrolData?: {
    __typename?: 'Subcontrol'
    id: string
    refCode: string
    category?: string | null
    subcategory?: string | null
    referenceFramework?: string | null
  }[]
  droppedControls: MapControl[]
  expandedItems: Record<string, boolean>
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  title: 'From' | 'To'
  setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>
}

const MapControlFrameworksAccordion: React.FC<Props> = ({ controlData, subcontrolData, droppedControls, expandedItems, setExpandedItems, title, setDroppedControls }) => {
  const { standardOptions } = useStandardsSelect({})

  const { availableControls, selectedIds, setSelectedIds, contextMenu, setContextMenu, handleContextMenu, handleAddToMapping, createDragPreview } = useMapControls({
    controlData,
    subcontrolData,
    droppedControls,
    title,
  })

  const controlsByFramework = useMemo(() => {
    const map: Record<string, MapControl[]> = {}
    standardOptions.forEach((opt) => {
      map[opt.label] = []
    })
    map['custom'] = []

    availableControls.forEach((ctrl) => {
      const key = ctrl.referenceFramework || 'custom'
      if (!map[key]) map[key] = []
      map[key].push(ctrl)
    })

    return map
  }, [availableControls, standardOptions])

  const openKeys = useMemo(
    () =>
      Object.entries(expandedItems)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [expandedItems],
  )
  const handleValueChange = (newOpen: string[]) => {
    const keys = standardOptions.map((o) => o.label).concat('custom')
    const next: Record<string, boolean> = {}
    keys.forEach((k) => {
      next[k] = newOpen.includes(k)
    })
    setExpandedItems(next)
  }

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    standardOptions.forEach((o) => {
      initial[o.label] = false
    })
    initial['custom'] = false
    setExpandedItems(initial)
  }, [standardOptions, setExpandedItems])

  useEffect(() => {
    const droppedIds = new Set(droppedControls.map((c) => c.id))
    setSelectedIds((prev) => prev.filter((id) => !droppedIds.has(id)))
  }, [droppedControls, setSelectedIds])

  return (
    <Accordion type="multiple" className="w-full" value={openKeys} onValueChange={handleValueChange}>
      {standardOptions.map(
        (opt) =>
          controlsByFramework[opt.label]?.length > 0 && (
            <AccordionItem key={opt.label} value={opt.label}>
              <RelationsAccordionTrigger label={opt.label} count={controlsByFramework[opt.label].length} />
              <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
                {controlsByFramework[opt.label].map((c) => (
                  <ControlChip
                    key={c.id}
                    clickable={false}
                    draggable
                    control={c}
                    selected={selectedIds.includes(c.id)}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedIds((prev) => (prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                      } else {
                        setSelectedIds([c.id])
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, c)}
                    onDragStart={(e) => {
                      const dragSet = selectedIds.includes(c.id) ? availableControls.filter((x) => selectedIds.includes(x.id)) : [c]
                      e.dataTransfer.setData('application/json', JSON.stringify(dragSet))
                      const preview = createDragPreview(`${dragSet.length} item${dragSet.length > 1 ? 's' : ''}`)
                      e.dataTransfer.setDragImage(preview, 0, 0)
                    }}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ),
      )}

      {controlsByFramework.custom.length > 0 && (
        <AccordionItem key="custom" value="custom">
          <RelationsAccordionTrigger label="Custom" count={controlsByFramework.custom.length} />
          <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
            {controlsByFramework.custom.map((c) => (
              <ControlChip
                key={c.id}
                draggable
                control={c}
                selected={selectedIds.includes(c.id)}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setSelectedIds((prev) => (prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                  } else {
                    setSelectedIds([c.id])
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, c)}
                onDragStart={(e) => {
                  const dragSet = selectedIds.includes(c.id) ? availableControls.filter((x) => selectedIds.includes(x.id)) : [c]
                  e.dataTransfer.setData('application/json', JSON.stringify(dragSet))
                  const preview = createDragPreview(`${dragSet.length} item${dragSet.length > 1 ? 's' : ''}`)
                  e.dataTransfer.setDragImage(preview, 0, 0)
                }}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}>
          <button className="px-4 py-2  w-full text-left" onClick={() => handleAddToMapping(setDroppedControls)}>
            Add to Mapping
          </button>
        </ContextMenu>
      )}
    </Accordion>
  )
}

export default MapControlFrameworksAccordion
