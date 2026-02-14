'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'

interface CheckboxFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate = false, internalEditing, setInternalEditing, className }) => {
  const { control } = useFormContext()
  const isFieldEditing = isCreate || internalEditing
  const isActive = isCreate || isEditing || isFieldEditing

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center space-x-2', className)}>
          <FormControl>
            <Checkbox
              id={name}
              name={name}
              checked={!!field.value}
              disabled={!isActive}
              onCheckedChange={(checked) => field.onChange(checked)}
              onBlur={() => {
                field.onBlur()
                if (!isCreate && !isEditing) {
                  setInternalEditing(internalEditing)
                }
              }}
            />
          </FormControl>
          <FormLabel
            htmlFor={name}
            className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', !isFieldEditing && 'cursor-default')}
            onClick={() => {
              if (isEditAllowed && !isActive) {
                setInternalEditing(internalEditing)
              }
            }}
          >
            {label}
          </FormLabel>
        </FormItem>
      )}
    />
  )
}
