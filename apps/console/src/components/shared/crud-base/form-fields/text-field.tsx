'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'

interface TextFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  placeholder?: string
  type?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
}

export const TextField: React.FC<TextFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate = false, data, placeholder, type = 'text', internalEditing, setInternalEditing }) => {
  const { control } = useFormContext()
  const isFieldEditing = isCreate || internalEditing
  const value = data?.[name]

  // Show input if creating, or if sheet is in edit mode, or if this specific field is being edited
  const shouldShowInput = isCreate || isEditing || isFieldEditing

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
                type={type}
                placeholder={placeholder}
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
