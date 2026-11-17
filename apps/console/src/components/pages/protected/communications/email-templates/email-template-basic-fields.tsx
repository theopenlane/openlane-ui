'use client'

import React, { useId } from 'react'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { isEmailTemplateType, type EmailTemplateType } from '@/lib/email-template-type'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

interface EmailTemplateBasicFieldsProps {
  name: string
  onNameChange: (value: string) => void
  type: EmailTemplateType
  typeOptions: EmailTemplateType[]
  onTypeChange: (value: EmailTemplateType) => void
  typeLocked: boolean
}

type EmailTemplateNameFieldProps = Pick<EmailTemplateBasicFieldsProps, 'name' | 'onNameChange'> & { placeholder?: string }

export const EmailTemplateNameField: React.FC<EmailTemplateNameFieldProps> = ({ name, onNameChange, placeholder = 'e.g. Welcome Email' }) => {
  const nameId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" htmlFor={nameId}>
        Name<span className="text-destructive">*</span>
      </label>
      <Input id={nameId} value={name} onChange={(e) => onNameChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export const EmailTemplateBasicFields: React.FC<EmailTemplateBasicFieldsProps> = ({ name, onNameChange, type, typeOptions, onTypeChange, typeLocked }) => {
  const typeId = useId()

  return (
    <div className="flex flex-col gap-4">
      <EmailTemplateNameField name={name} onNameChange={onNameChange} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor={typeId}>
          Type
        </label>
        <Select value={type} onValueChange={(value) => isEmailTemplateType(value) && onTypeChange(value)} disabled={typeLocked}>
          <SelectTrigger id={typeId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {getEnumLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {typeLocked ? 'The type of a saved template cannot be changed.' : 'Questionnaire templates are sent by questionnaire campaigns and always include the questionnaire access button.'}
        </p>
      </div>
    </div>
  )
}
