'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'

interface DateTimeFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  placeholder?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate = false, data, placeholder, internalEditing, setInternalEditing, className }) => {
  const { control } = useFormContext()
  const isFieldEditing = isCreate || internalEditing
  const value = data?.[name]

  // Show input if creating, or if sheet is in edit mode, or if this specific field is being edited
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  // Format datetime-local value from ISO string
  const formatValue = (val: string) => {
    if (!val) return ''
    try {
      const date = new Date(val)
      return date.toISOString().slice(0, 16)
    } catch {
      return val
    }
  }

  const displayValue = (val: string) => {
    if (!val) return <span className="text-muted-foreground italic">Not set</span>
    try {
      const date = new Date(val)
      return date.toLocaleString()
    } catch {
      return val
    }
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {shouldShowInput ? (
              <Input
                {...field}
                type="datetime-local"
                placeholder={placeholder}
                value={field.value ? formatValue(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value)}
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
                {displayValue(value)}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
