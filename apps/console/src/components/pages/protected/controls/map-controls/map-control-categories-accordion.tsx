import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { useGetControlCategories } from '@/lib/graphql-hooks/controls'
import { useMapControls } from './shared/use-selectable-controls'
import ContextMenu from '@/components/shared/context-menu/context-menu'
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
  droppedControls: MapControl[]
  expandedItems: Record<string, boolean>
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  subcontrolData?: {
    __typename?: 'Subcontrol'
    id: string
    refCode: string
    category?: string | null
    subcategory?: string | null
    referenceFramework?: string | null
    controlID?: string
  }[]
  title: 'From' | 'To'
  setDroppedControls: React.Dispatch<React.SetStateAction<MapControl[]>>
}

const MapControlCategoriesAccordion = ({ controlData, droppedControls, expandedItems, setExpandedItems, subcontrolData, title, setDroppedControls }: Props) => {
  const { data } = useGetControlCategories({})

  const { availableControls, selectedIds, setSelectedIds, contextMenu, setContextMenu, handleContextMenu, handleAddToMapping, createDragPreview } = useMapControls({
    controlData,
    subcontrolData,
    droppedControls,
    title,
  })

  const categories = useMemo(() => {
    const cats = data?.controlCategories?.filter((c): c is string => !!c) || []
    cats.push('Custom')
    return cats
  }, [data])

  const controlsByCategory = useMemo(() => {
    const map: Record<string, MapControl[]> = {}
    categories.forEach((cat) => {
      map[cat] = []
    })
    availableControls.forEach((ctrl) => {
      const category = ctrl.category || 'Custom'
      if (!map[category]) map[category] = []
      map[category].push(ctrl)
    })
    return Object.fromEntries(Object.entries(map).filter(([, list]) => list.length > 0))
  }, [availableControls, categories])

  const openKeys = useMemo(
    () =>
      Object.entries(expandedItems)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [expandedItems],
  )
  const handleValueChange = (newOpen: string[]) => {
    const next: Record<string, boolean> = {}
    categories.forEach((cat) => {
      next[cat] = newOpen.includes(cat)
    })
    setExpandedItems(next)
  }

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => {
      initial[cat] = false
    })
    setExpandedItems(initial)
  }, [categories, setExpandedItems])

  useEffect(() => {
    const droppedIds = new Set(droppedControls.map((c) => c.id))
    setSelectedIds((prev) => prev.filter((id) => !droppedIds.has(id)))
  }, [droppedControls, setSelectedIds])

  return (
    <Accordion type="multiple" className="w-full" value={openKeys} onValueChange={handleValueChange}>
      {Object.entries(controlsByCategory).map(([cat, items]) => (
        <AccordionItem key={cat} value={cat}>
          <RelationsAccordionTrigger label={cat} count={items.length} />
          <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
            {items.map((c) => (
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
      ))}

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

export default MapControlCategoriesAccordion
