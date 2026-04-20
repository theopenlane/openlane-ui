'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '../generic-sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

interface CheckboxFieldProps<TUpdateInput = Record<string, unknown>> {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
  tooltipContent?: string
}

export const CheckboxField = <TUpdateInput,>({
  name,
  label,
  isEditAllowed,
  isCreate = false,
  isEditing,
  handleUpdate,
  internalEditing: _internalEditing,
  setInternalEditing: _setInternalEditing,
  className,
  tooltipContent,
}: CheckboxFieldProps<TUpdateInput>) => {
  const { control } = useFormContext()
  const disabled = !isEditAllowed && !isCreate

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
              onCheckedChange={async (checked) => {
                field.onChange(checked)
                if (!isCreate && !isEditing && handleUpdate) {
                  await Promise.resolve(handleUpdate({ [name]: checked } as TUpdateInput))
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
