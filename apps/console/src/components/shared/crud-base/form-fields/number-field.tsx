'use client'

import { FieldValues, useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { InternalEditingType } from '../generic-sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

interface NumberFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  placeholder?: string
  min?: number
  max?: number
  step?: number
  tooltipContent?: string
}

export const NumberField: React.FC<NumberFieldProps> = ({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  internalEditing,
  setInternalEditing,
  placeholder,
  min,
  max,
  step = 1,
  tooltipContent,
}) => {
  const { control } = useFormContext()
  const value = data?.[name]
  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1">
            <FormLabel>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {shouldShowInput ? (
              <Input
                {...field}
                type={'number'}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                onBlur={() => {
                  field.onBlur()
                  if (!isCreate && !isEditing) {
                    setInternalEditing(null)
                  }
                }}
              />
            ) : (
              <div
                className="text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {value || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
