'use client'

import React, { Fragment, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'

const AssociatedObjectsAccordion: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['controls'])
  const associationRefCodes = useProcedure((state) => state.associationRefCodes)

  const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
    <AccordionTrigger asChild>
      <button className="group flex items-center py-2 text-left gap-3 w-full bg-unset">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
          <span className="text-base font-medium">{label}</span>
        </div>
        <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
      </button>
    </AccordionTrigger>
  )

  const toHumanReadable = (str: string) =>
    str
      .replace(/IDs$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())

  return (
    <div className="space-y-4">
      <Accordion type="multiple" value={expandedItems} onValueChange={(values) => setExpandedItems(values)} className="w-full">
        {Object.entries(associationRefCodes).map(([key, refCodes]) => {
          return (
            <AccordionItem key={key} value={key}>
              <SectionTrigger label={toHumanReadable(key)} count={refCodes!.length} />
              <AccordionContent>
                <div className="flex gap-[5px]">
                  {refCodes!.map((refCode, index) => (
                    <Fragment key={`${refCode}-${index}`}>
                      <Badge className="bg-secondary mr-1" variant="outline">
                        {refCode}
                      </Badge>
                    </Fragment>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsAccordion
