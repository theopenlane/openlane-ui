'use client'

import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { cn } from '@repo/ui/lib/utils'
import { FieldValues } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'

interface DateTimeFieldProps {
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
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ name, label, isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, placeholder, className }) => {
  const isFieldEditing = isCreate || internalEditing
  const value = data?.[name] || ''

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
    if (!val) return 'Not set'
    try {
      const date = new Date(val)
      return date.toLocaleString()
    } catch {
      return val
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>{label}</Label>
      {isFieldEditing ? (
        <Input id={name} name={name} type="datetime-local" defaultValue={formatValue(value)} placeholder={placeholder} className="w-full" />
      ) : (
        <div className="text-sm text-muted-foreground">{displayValue(value)}</div>
      )}
    </div>
  )
}
