import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import { GetControlSelectOptionsQuery, GetSubcontrolSelectOptionsQuery } from '@repo/codegen/src/schema'
import { DroppedControl } from './map-controls-card'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { useGetControlCategories } from '@/lib/graphql-hooks/controls'

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
  expandedItems: Record<string, boolean>
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  subcontrolData?: GetSubcontrolSelectOptionsQuery
}

const MapControlCategoriesAccordion = ({ controlData, droppedControls, expandedItems, setExpandedItems, subcontrolData }: Props) => {
  const droppedIds = useMemo(() => droppedControls.map((dc) => dc.id), [droppedControls])
  const { data } = useGetControlCategories()
  const categories = useMemo(() => data?.controlCategories?.map((val) => val).filter((val): val is string => !!val) || [], [data])

  const controlsByCategory = useMemo(() => {
    const map: Record<string, { id: string; refCode: string; referenceFramework?: string; type: 'control' | 'subcontrol' }[]> = {}
    categories.forEach((cat) => {
      map[cat] = []
    })

    controlData?.forEach((control) => {
      if (!control || !control.refCode || droppedIds.includes(control.id)) return

      const categoryValue = control.category || ''
      if (categoryValue && map[categoryValue]) {
        map[categoryValue].push({
          id: control.id ?? '',
          refCode: control.refCode,
          referenceFramework: control.referenceFramework || undefined,
          type: 'control',
        })
      }
    })

    subcontrolData?.subcontrols?.edges?.forEach((edge) => {
      const control = edge?.node
      if (!control || !control.refCode || droppedIds.includes(control.id)) return

      const categoryValue = control.category || ''
      if (categoryValue && map[categoryValue]) {
        map[categoryValue].push({
          id: control.id,
          refCode: control.refCode,
          referenceFramework: control.referenceFramework || undefined,
          type: 'subcontrol',
        })
      }
    })

    return Object.fromEntries(Object.entries(map).filter(([, controls]) => controls.length > 0))
  }, [controlData, categories, droppedIds, subcontrolData])

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

  return (
    <Accordion type="multiple" className="w-full" value={openKeys} onValueChange={handleValueChange}>
      {Object.entries(controlsByCategory).map(([cat, items]) => (
        <AccordionItem key={cat} value={cat}>
          <RelationsAccordionTrigger label={cat} count={items.length} />
          <AccordionContent className="my-3 flex flex-wrap gap-2">
            {items.map((c) => (
              <ControlChip
                key={c.id}
                draggable
                control={{ id: c.id, refCode: c.refCode, shortName: c.referenceFramework || '', type: c.type }}
                onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ id: c.id, refCode: c.refCode, shortName: c.referenceFramework, type: c.type }))}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default MapControlCategoriesAccordion
