import Drag from '@/assets/Drag'
import RelationsAccordionTrigger from '@/components/shared/relations-accordion-trigger.tsx/relations-accordion-trigger'
import { Accordion, AccordionContent, AccordionItem } from '@radix-ui/react-accordion'
import { Badge } from '@repo/ui/badge'
import React from 'react'

const frameworks = ['ISO 27001', 'NIST 800-53', 'NIST CSF', 'SOC 2']

const MatchedControls = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 border-t pt-5">
        <span className="w-full">Matched controls</span>
      </div>
      {frameworks.map((fw) => {
        const count = Math.floor(Math.random() * 5) + 1
        return (
          <Accordion key={fw} type="single" collapsible className="w-full">
            <AccordionItem value={fw}>
              <RelationsAccordionTrigger label={fw} count={count} />
              <AccordionContent className="my-3 flex flex-wrap gap-2">
                {[`${fw} • A.8.2.1`, 'SOC 2 • CC2.3', 'SOC 2 • CC1.1'].map((item) => (
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
