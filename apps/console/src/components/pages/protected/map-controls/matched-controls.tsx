import Drag from '@/assets/Drag'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { useControlSelect } from '@/lib/graphql-hooks/controls'
import { useStandardsSelect } from '@/lib/graphql-hooks/standards'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { GetControlSelectOptionsQuery } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import React, { useMemo } from 'react'

const frameworks = ['ISO 27001', 'NIST 800-53', 'NIST CSF', 'SOC 2']

interface Props {
  controlsData: GetControlSelectOptionsQuery | undefined
}

const MatchedControls = ({ controlsData }: Props) => {
  const { standardOptions } = useStandardsSelect({})
  console.log('standardOptions', standardOptions)
  console.log('controlsData', controlsData)

  // const mapData = useMemo(()=> {

  // })
  return (
    <div>
      <div className="flex items-center justify-between mb-2 border-t pt-5">
        <span className="w-full">Matched controls</span>
      </div>
      {standardOptions.map((standardOption, i) => {
        const count = Math.floor(Math.random() * 5) + 1
        return (
          <Accordion key={i} type="single" collapsible className="w-full">
            <AccordionItem value={standardOption.label}>
              <RelationsAccordionTrigger label={standardOption.label} count={count} />
              <AccordionContent className="my-3 flex flex-wrap gap-2">
                {[`${standardOption.label} • A.8.2.1`, 'SOC 2 • CC2.3', 'SOC 2 • CC1.1'].map((item) => (
                  <Badge key={item} variant="outline" className="bg-background-secondary cursor-grab flex gap-1" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', item)}>
                    <Drag strokeWidth={1} className="text-border" />
                    {item}
                  </Badge>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      })}
    </div>
  )
}

export default MatchedControls
