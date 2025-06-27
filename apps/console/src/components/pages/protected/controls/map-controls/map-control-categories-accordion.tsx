import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import { DroppedControl } from './map-controls-card'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { useGetControlCategories } from '@/lib/graphql-hooks/controls'
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
  expandedItems: Record<string, boolean>
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
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

const MapControlCategoriesAccordion = ({ controlData, droppedControls, expandedItems, setExpandedItems, subcontrolData, title }: Props) => {
  const { data } = useGetControlCategories({})

  const form = useFormContext()

  const categories = useMemo(() => {
    const cats = data?.controlCategories?.map((val) => val).filter((val): val is string => !!val) || []
    cats.push('Custom')
    return cats
  }, [data])

  const controlsByCategory = useMemo(() => {
    const oppositeControlIDs: string[] = form.getValues(title === 'From' ? 'toControlIDs' : 'fromControlIDs') || []
    const oppositeSubcontrolIDs: string[] = form.getValues(title === 'From' ? 'toSubcontrolIDs' : 'fromSubcontrolIDs') || []

    const droppedIds = droppedControls.map((dc) => dc.id)
    const excludeIds = new Set([...droppedIds, ...oppositeControlIDs, ...oppositeSubcontrolIDs])

    const map: Record<string, { id: string; refCode: string; referenceFramework?: string; type: 'control' | 'subcontrol' }[]> = {}
    categories.forEach((cat) => {
      map[cat] = []
    })

    controlData?.forEach((control) => {
      if (!control || !control.refCode || excludeIds.has(control.id)) return
      const categoryValue = control.category || 'Custom'
      map[categoryValue]?.push({
        id: control.id,
        refCode: control.refCode,
        referenceFramework: control.referenceFramework || undefined,
        type: 'control',
      })
    })

    subcontrolData?.forEach((subcontrol) => {
      if (!subcontrol || !subcontrol.refCode || excludeIds.has(subcontrol.id)) return
      const categoryValue = subcontrol.category || 'Custom'
      map[categoryValue]?.push({
        id: subcontrol.id,
        refCode: subcontrol.refCode,
        referenceFramework: subcontrol.referenceFramework || undefined,
        type: 'subcontrol',
      })
    })

    return Object.fromEntries(Object.entries(map).filter(([, list]) => list.length > 0))
  }, [controlData, subcontrolData, droppedControls, title, categories, form])

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
          <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
            {items.map((c) => (
              <ControlChip
                key={c.id}
                draggable
                control={{ id: c.id, refCode: c.refCode, shortName: c.referenceFramework || 'CUSTOM', type: c.type }}
                onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ id: c.id, refCode: c.refCode, shortName: c.referenceFramework || 'CUSTOM', type: c.type }))}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export default MapControlCategoriesAccordion
