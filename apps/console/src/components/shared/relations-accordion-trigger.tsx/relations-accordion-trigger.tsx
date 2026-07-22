import { AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import React from 'react'
import CountBadge from '@/components/shared/count-badge/count-badge'

const RelationsAccordionTrigger = ({ label, count }: { label: string; count: number }) => (
  <AccordionTrigger asChild className="bg-unset">
    <button className="group flex items-center text-left gap-3 w-full">
      <div className="flex items-center gap-2">
        <ChevronDown size={22} className=" text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0 text-brand" />
        <span className="text-base font-medium">{label}</span>
      </div>
      <CountBadge count={count} />
    </button>
  </AccordionTrigger>
)

export default RelationsAccordionTrigger
