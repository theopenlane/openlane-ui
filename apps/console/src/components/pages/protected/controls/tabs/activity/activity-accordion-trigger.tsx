import React from 'react'
import { AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'

const ActivityAccordionTrigger = ({ label, count }: { label: string; count?: number }) => (
  <AccordionTrigger asChild className="bg-unset">
    <button className="group flex w-full items-center justify-between text-left">
      <div className="flex items-center gap-2">
        <ChevronDown size={20} className="text-primary transform transition-transform group-data-[state=open]:rotate-0" />
        <span className="text-base font-semibold">{label}</span>
        {typeof count === 'number' && <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[22px] w-[22px]">{count}</span>}
      </div>
    </button>
  </AccordionTrigger>
)

export default ActivityAccordionTrigger
