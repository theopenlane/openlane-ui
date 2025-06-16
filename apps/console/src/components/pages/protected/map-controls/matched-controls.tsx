import Drag from '@/assets/Drag'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { GetControlSelectOptionsQuery } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import React, { useMemo } from 'react'
import { DroppedControl } from './map-controls-card'

interface Props {
  controlsData: GetControlSelectOptionsQuery | undefined
  droppedControls: DroppedControl[]
}

const MatchedControls = ({ controlsData, droppedControls }: Props) => {
  const { standardOptions } = useStandardsSelect({})

  const droppedControlIds = useMemo(() => droppedControls.map((dc) => dc.id), [droppedControls])

  const { controlsByFramework, customControls } = useMemo(() => {
    const controlsByFramework: Record<string, { id: string; refCode: string }[]> = {}
    const customControls: { id: string; refCode: string }[] = []

    controlsData?.controls?.edges?.forEach((edge) => {
      const control = edge?.node
      if (!control || !control.refCode || droppedControlIds.includes(control.id)) return

      if (control.referenceFramework) {
        const key = control.referenceFramework
        if (!controlsByFramework[key]) controlsByFramework[key] = []
        controlsByFramework[key].push({ id: control.id, refCode: control.refCode })
      } else {
        customControls.push({ id: control.id, refCode: control.refCode })
      }
    })

    return { controlsByFramework, customControls }
  }, [controlsData, droppedControlIds])

  return (
    <div>
      <div className="flex items-center justify-between mb-2 border-t pt-5">
        <span className="w-full">Matched controls</span>
      </div>

      {standardOptions.map((standardOption, i) => {
        const shortName = standardOption.label
        const matchedControls = controlsByFramework[shortName] || []

        return (
          <Accordion key={i} type="single" collapsible className="w-full">
            <AccordionItem value={shortName}>
              <RelationsAccordionTrigger label={shortName} count={matchedControls.length} />
              <AccordionContent className="my-3 flex flex-wrap gap-2">
                {matchedControls.map((control) => (
                  <Badge
                    key={control.id}
                    variant="outline"
                    className="bg-background-secondary cursor-grab flex gap-1"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', control.refCode)}
                  >
                    <Drag strokeWidth={1} className="text-border" />
                    <span className="text-text-informational">{shortName}</span> <span className="text-border">|</span> {control.refCode}
                  </Badge>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      })}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="custom">
          <RelationsAccordionTrigger label="Custom" count={customControls.length} />
          <AccordionContent className="my-3 flex flex-wrap gap-2">
            {customControls.map((control) => (
              <Badge
                key={control.id}
                variant="outline"
                className="bg-background-secondary cursor-grab flex gap-1"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify({ id: control.id, refCode: control.refCode }))}
              >
                <Drag strokeWidth={1} className="text-border" />
                <span className="text-text-informational">CUSTOM </span> <span className="text-border">|</span> {control.refCode}
              </Badge>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default MatchedControls
