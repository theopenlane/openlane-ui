'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'
import { formatDateTime } from '@/utils/date'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdate?: (input: any) => Promise<void>
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  placeholder,
  internalEditing,
  setInternalEditing,
  className,
  handleUpdate,
}) => {
  const { control, getValues } = useFormContext()
  const value = data?.[name]

  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  const handleBlur = async () => {
    if (isEditing) return

    const newValue = getValues(name)
    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ [name]: newValue }))
    }
    setInternalEditing(null)
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
                value={field.value ? formatDateTime(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={handleBlur}
              />
            ) : (
              <div
                className="text-sm py-2 rounded cursor-pointer hover:bg-accent"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {value ? formatDateTime(value) : <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
