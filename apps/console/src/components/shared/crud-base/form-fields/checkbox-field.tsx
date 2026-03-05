'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '../generic-sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

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
  tooltipContent?: string
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ name, label, isEditAllowed, isCreate = false, isEditing, internalEditing, setInternalEditing, className, tooltipContent }) => {
  const { control } = useFormContext()
  const disabled = !isEditAllowed

  console.log(disabled)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center space-x-2 space-y-0', className)}>
          <FormControl>
            <Checkbox
              id={name}
              name={name}
              checked={!!field.value}
              disabled={disabled}
              className="items-center"
              onCheckedChange={(checked) => {
                if (!isCreate && !isEditing && internalEditing !== name) {
                  setInternalEditing(name)
                }
                field.onChange(checked)
              }}
              onBlur={() => {
                field.onBlur()
                if (!isCreate && !isEditing) {
                  setInternalEditing(null)
                }
              }}
            />
          </FormControl>
          <FormLabel
            htmlFor={disabled ? undefined : name}
            className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center', disabled && 'cursor-not-allowed opacity-70')}
          >
            <span className="flex items-center gap-1">
              {label}
              {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1" />} content={tooltipContent} />}
            </span>
          </FormLabel>
        </FormItem>
      )}
    />
  )
}
