'use client'

import { FieldValues, useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { InternalEditingType } from '../generic-sheet'

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
  className?: string
  min?: number
  max?: number
  step?: number
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
  className,
  min,
  max,
  step = 1,
}) => {
  const { control } = useFormContext()
  const value = data?.[name]
  const shouldShowInput = isCreate || isEditing || internalEditing

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
                    setInternalEditing(internalEditing)
                  }
                }}
              />
            ) : (
              <div
                className="text-sm py-2 rounded cursor-pointer hover:bg-accent"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(internalEditing)
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
