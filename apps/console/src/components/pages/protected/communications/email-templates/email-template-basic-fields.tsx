'use client'

import React, { useId } from 'react'
import { Input } from '@repo/ui/input'

interface EmailTemplateBasicFieldsProps {
  name: string
  onNameChange: (value: string) => void
}

export const EmailTemplateBasicFields: React.FC<EmailTemplateBasicFieldsProps> = ({ name, onNameChange }) => {
  const nameId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" htmlFor={nameId}>
        Name<span className="text-destructive">*</span>
      </label>
      <Input id={nameId} value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Welcome Email" />
    </div>
  )
}
