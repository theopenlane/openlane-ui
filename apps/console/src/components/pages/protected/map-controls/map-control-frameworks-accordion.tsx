import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { GetControlSelectOptionsQuery, GetSubcontrolSelectOptionsQuery } from '@repo/codegen/src/schema'
import { DroppedControl } from './map-controls-card'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'

interface Props {
  controlData?: GetControlSelectOptionsQuery
  droppedControls: DroppedControl[]
  expandedItems: Record<string, boolean>
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  subcontrolData?: GetSubcontrolSelectOptionsQuery
}

type SubcontrolOrControl =
  | {
      id: string
      refCode: string
      category?: string | null
      subcategory?: string | null
      referenceFramework?: string | null
    }
  | null
  | undefined

const MapControlFrameworksAccordion: React.FC<Props> = ({ controlData, droppedControls, expandedItems, setExpandedItems, subcontrolData }) => {
  const { standardOptions } = useStandardsSelect({})
  const droppedIds = useMemo(() => new Set(droppedControls.map((dc) => dc.id)), [droppedControls])

  const { controlsByFramework, customControls } = useMemo(() => {
    const byFramework: Record<string, { id: string; refCode: string; type: 'control' | 'subcontrol' }[]> = {}
    const custom: { id: string; refCode: string; type: 'control' | 'subcontrol' }[] = []

    const addControl = (control: SubcontrolOrControl, type: 'control' | 'subcontrol') => {
      if (!control || !control.refCode || droppedIds.has(control.id)) return

      const key = control.referenceFramework ?? 'custom'
      const item = {
        id: control.id,
        refCode: control.refCode,
        type,
      }

      if (key === 'custom') {
        custom.push(item)
      } else {
        byFramework[key] = byFramework[key] || []
        byFramework[key].push(item)
      }
    }

    controlData?.controls?.edges?.forEach((edge) => addControl(edge?.node, 'control'))
    subcontrolData?.subcontrols?.edges?.forEach((edge) => addControl(edge?.node, 'subcontrol'))

    return { controlsByFramework: byFramework, customControls: custom }
  }, [controlData, subcontrolData, droppedIds])

  const openKeys = useMemo(
    () =>
      Object.entries(expandedItems)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [expandedItems],
  )

  const handleValueChange = (newOpen: string[]) => {
    const allKeys = [...standardOptions.map((o) => o.label), 'custom']
    const next: Record<string, boolean> = {}
    allKeys.forEach((k) => {
      next[k] = newOpen.includes(k)
    })
    setExpandedItems(next)
  }

  useEffect(() => {
    const initialItems: Record<string, boolean> = {}
    standardOptions.forEach((opt) => {
      initialItems[opt.label] = false
    })
    initialItems['custom'] = false
    setExpandedItems(initialItems)
  }, [setExpandedItems, standardOptions])

  return (
    <Accordion type="multiple" className="w-full" value={openKeys} onValueChange={handleValueChange}>
      {standardOptions.map((opt) => {
        const key = opt.label
        const items = controlsByFramework[key] || []
        return (
          <AccordionItem key={key} value={key}>
            <RelationsAccordionTrigger label={key} count={items.length} />
            <AccordionContent className="my-3 flex flex-wrap gap-2">
              {items.map((c) => (
                <ControlChip
                  key={c.id}
                  draggable
                  control={{ id: c.id, refCode: c.refCode, shortName: key, type: c.type }}
                  onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ id: c.id, refCode: c.refCode, shortName: key, type: c.type }))}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )
      })}

      {/* Custom section */}
      <AccordionItem key="custom" value="custom">
        <RelationsAccordionTrigger label="Custom" count={customControls.length} />
        <AccordionContent className="my-3 flex flex-wrap gap-2">
          {customControls.map((c) => (
            <ControlChip
              key={c.id}
              draggable
              control={{ id: c.id, refCode: c.refCode, shortName: 'CUSTOM', type: c.type }}
              onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ id: c.id, refCode: c.refCode, shortName: 'CUSTOM', type: c.type }))}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default MapControlFrameworksAccordion
