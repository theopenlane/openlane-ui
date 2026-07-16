'use client'

import React from 'react'
import { AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import CountBadge from '../count-badge/count-badge'

type Props = {
  label: string
  count?: number
}

const AccordionSectionTrigger: React.FC<Props> = ({ label, count }) => (
  <AccordionTrigger asChild>
    <button type="button" className="group flex items-center py-2 text-left bg-transparent gap-3 w-full">
      <span className="text-sm font-medium flex-1">{label}</span>
      {count !== undefined && <CountBadge count={count} />}
      <ChevronDown className="h-4 w-4 text-muted-foreground transform -rotate-90 transition-transform group-data-[state=open]:rotate-0 shrink-0" />
    </button>
  </AccordionTrigger>
)

export default AccordionSectionTrigger
