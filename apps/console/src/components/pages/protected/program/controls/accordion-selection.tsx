'use client'

import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import React from 'react'

type AccordionSectionProps = {
  label: string
  content?: string | string[] | null
  value: string
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ label, content, value }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) return null

  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted text-sm font-medium [&[data-state=open]_.accordion-chevron]:rotate-180">
        <span className="text-xl">{label}</span>
        <ChevronDown className="accordion-chevron transition-transform duration-200" />
      </AccordionTrigger>
      <AccordionContent className="px-2 pb-3 text-sm text-muted-foreground">
        {Array.isArray(content) ? (
          <ul className="list-disc list-inside space-y-1">
            {content.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{content}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export default AccordionSection
