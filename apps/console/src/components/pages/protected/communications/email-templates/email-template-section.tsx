'use client'

import React from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

interface EmailTemplateSectionProps {
  value: string
  title: string
  contentClassName?: string
  children: React.ReactNode
}

export const EmailTemplateSection: React.FC<EmailTemplateSectionProps> = ({ value, title, contentClassName, children }) => (
  <AccordionItem value={value} className="rounded-lg border border-border bg-card overflow-hidden">
    <AccordionTrigger asChild>
      <div className="flex items-center justify-between w-full px-4 py-3 cursor-pointer group">
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown size={18} className="text-muted-foreground transform transition-transform group-data-[state=open]:rotate-180" />
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div className={cn('border-t border-border px-4 py-4', contentClassName)}>{children}</div>
    </AccordionContent>
  </AccordionItem>
)
