import { AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import React from 'react'

const RelationsAccordionTrigger = ({ label, count }: { label: string; count: number }) => (
  <AccordionTrigger asChild>
    <button className="group flex items-center text-left gap-3 w-full">
      <div className="flex items-center gap-2">
        <ChevronDown size={22} className=" text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0 text-brand" />
        <span className="text-base font-medium">{label}</span>
      </div>
      <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
    </button>
  </AccordionTrigger>
)

export default RelationsAccordionTrigger
