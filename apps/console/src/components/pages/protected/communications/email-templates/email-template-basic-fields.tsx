'use client'

import React from 'react'
import { Input } from '@repo/ui/input'

interface EmailTemplateBasicFieldsProps {
  name: string
  onNameChange: (value: string) => void
}

export const EmailTemplateBasicFields: React.FC<EmailTemplateBasicFieldsProps> = ({ name, onNameChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium">
      Name<span className="text-destructive">*</span>
    </label>
    <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Welcome Email" />
  </div>
)
