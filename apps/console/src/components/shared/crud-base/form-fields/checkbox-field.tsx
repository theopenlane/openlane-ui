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

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ name, label, isEditing, isCreate = false, internalEditing, setInternalEditing, className, tooltipContent }) => {
  const { control } = useFormContext()
  const isFieldEditing = internalEditing === name
  const isActive = isCreate || isEditing || isFieldEditing

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
              disabled={!isActive}
              className="items-center"
              onCheckedChange={(checked) => field.onChange(checked)}
              onBlur={() => {
                field.onBlur()
                if (!isCreate && !isEditing) {
                  setInternalEditing(null)
                }
              }}
            />
          </FormControl>
          <FormLabel
            htmlFor={isActive ? name : undefined}
            className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center', !isActive && 'cursor-not-allowed opacity-70')}
            onClick={(e) => {
              if (!isActive) {
                e.preventDefault()
              }
            }}
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
