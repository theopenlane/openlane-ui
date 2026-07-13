'use client'

import React from 'react'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { EmailTemplateNotificationTemplateFormat } from '@repo/codegen/src/schema'
import type { EmailTemplateCatalogEntryNode } from '@/lib/graphql-hooks/email-template'

interface EmailTemplateBasicFieldsProps {
  name: string
  onNameChange: (value: string) => void
  selectedKey: string
  onKeyChange: (key: string) => void
  locale: string
  onLocaleChange: (value: string) => void
  format: EmailTemplateNotificationTemplateFormat
  onFormatChange: (value: EmailTemplateNotificationTemplateFormat) => void
  entries: EmailTemplateCatalogEntryNode[]
  selectedEntry?: EmailTemplateCatalogEntryNode
  readOnly: boolean
  isEditMode: boolean
}

export const EmailTemplateBasicFields: React.FC<EmailTemplateBasicFieldsProps> = ({
  name,
  onNameChange,
  selectedKey,
  onKeyChange,
  locale,
  onLocaleChange,
  format,
  onFormatChange,
  entries,
  selectedEntry,
  readOnly,
  isEditMode,
}) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Name<span className="text-destructive">*</span>
        </label>
        <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Welcome Email" disabled={readOnly} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Template<span className="text-destructive">*</span>
        </label>
        <Select value={selectedKey} onValueChange={onKeyChange} disabled={readOnly || isEditMode}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {entries.map((entry) => (
              <SelectItem key={entry.key} value={entry.key}>
                {entry.key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEntry?.description && <p className="text-xs text-muted-foreground">{selectedEntry.description}</p>}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Locale<span className="text-destructive">*</span>
        </label>
        <Input value={locale} onChange={(e) => onLocaleChange(e.target.value)} placeholder="en" disabled={readOnly} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Format</label>
        <Select value={format} onValueChange={(val) => onFormatChange(val as EmailTemplateNotificationTemplateFormat)} disabled={readOnly || isEditMode}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(EmailTemplateNotificationTemplateFormat).map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  </>
)
