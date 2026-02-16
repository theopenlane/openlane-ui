'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'
import { formatDate } from '@/utils/date'

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
  initialValue?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdate?: (input: any) => Promise<void>
  className?: string
  error?: string
}

export const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  placeholder,
  type = 'text',
  internalEditing,
  setInternalEditing,
  initialValue,
  handleUpdate,
  className,
  error,
}) => {
  const { control, getValues, formState } = useFormContext()

  const isFieldEditing = isCreate || isEditing || internalEditing === name
  const value = data?.[name] ?? initialValue ?? ''

  const handleBlur = async () => {
    if (isEditing) return

    const newValue = getValues(name)
    const oldValue = data?.[name] ?? initialValue ?? ''

    // Only update if changed and not empty
    if (!newValue || newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ [name]: newValue }))
    }

    setInternalEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(name)
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
            {isFieldEditing ? (
              <Input {...field} type={type} placeholder={placeholder} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus={internalEditing === name} />
            ) : (
              <div className="text-sm py-2 rounded cursor-pointer hover:bg-accent" onClick={handleClick}>
                {type === 'date' ? value ? formatDate(value) : <span className="text-muted-foreground italic">Not set</span> : value || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
          {(error || typeof formState.errors[name]?.message === 'string') && (
            <p className="text-red-500 text-sm">{error || (typeof formState.errors[name]?.message === 'string' ? formState.errors[name]?.message : '')}</p>
          )}
        </FormItem>
      )}
    />
  )
}
