'use client'

import React from 'react'
import { SelectContent, SelectItem } from '@repo/ui/select'

interface EmailTemplateSelectContentProps {
  options: Array<{ label: string; value: string }>
  isLoading?: boolean
  emptyText?: string
}

export const EmailTemplateSelectContent: React.FC<EmailTemplateSelectContentProps> = ({ options, isLoading, emptyText = 'No email templates available' }) => (
  <SelectContent>
    {isLoading ? (
      <div className="p-2 text-sm text-muted-foreground">Loading email templates...</div>
    ) : options.length === 0 ? (
      <div className="p-2 text-sm text-muted-foreground">{emptyText}</div>
    ) : (
      options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))
    )}
  </SelectContent>
)
