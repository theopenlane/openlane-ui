import React, { useEffect, useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import ControlChip from './shared/control-chip'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { DroppedControl } from './map-controls-card'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
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
  title: 'To' | 'From'
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

const MapControlFrameworksAccordion: React.FC<Props> = ({ controlData, droppedControls, expandedItems, setExpandedItems, subcontrolData, title }) => {
  const { standardOptions } = useStandardsSelect({})
  const form = useFormContext()

  const { controlsByFramework, customControls } = useMemo(() => {
    const oppositeControlIDs: string[] = form.getValues(title === 'From' ? 'toControlIDs' : 'fromControlIDs') || []
    const oppositeSubcontrolIDs: string[] = form.getValues(title === 'From' ? 'toSubcontrolIDs' : 'fromSubcontrolIDs') || []

    const excludeIds = new Set([...droppedControls.map((dc) => dc.id), ...oppositeControlIDs, ...oppositeSubcontrolIDs])

    const byFramework: Record<string, { id: string; refCode: string; type: 'control' | 'subcontrol' }[]> = {}
    const custom: { id: string; refCode: string; type: 'control' | 'subcontrol' }[] = []

    const addControl = (control: SubcontrolOrControl, type: 'control' | 'subcontrol') => {
      if (!control || !control.refCode || excludeIds.has(control.id)) return

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

    controlData?.forEach((control) => addControl(control, 'control'))
    subcontrolData?.forEach((subcontrol) => addControl(subcontrol, 'subcontrol'))

    return { controlsByFramework: byFramework, customControls: custom }
  }, [controlData, subcontrolData, droppedControls, title, form])

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
      {standardOptions
        .filter((opt) => (controlsByFramework[opt.label] || []).length > 0)
        .map((opt) => {
          const key = opt.label
          const items = controlsByFramework[key] || []
          return (
            <AccordionItem key={key} value={key}>
              <RelationsAccordionTrigger label={key} count={items.length} />
              <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
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

      {customControls.length > 0 && (
        <AccordionItem key="custom" value="custom">
          <RelationsAccordionTrigger label="Custom" count={customControls.length} />
          <AccordionContent className="my-3 flex flex-wrap gap-2 max-h-28 overflow-auto">
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
      )}
    </Accordion>
  )
}

export default MapControlFrameworksAccordion
