'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'
import { formatDate } from '@/utils/date'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

interface DateFieldProps<TUpdateInput> {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  className?: string
  tooltipContent?: string
  disableFuture?: boolean
}

export const DateField = <TUpdateInput,>({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  internalEditing,
  setInternalEditing,
  handleUpdate,
  className,
  tooltipContent,
  disableFuture,
}: DateFieldProps<TUpdateInput>) => {
  const { control } = useFormContext()

  const isFieldEditing = isCreate || isEditing || internalEditing === name
  const value = data?.[name] ?? ''

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
          <div className="flex items-center gap-1">
            <FormLabel>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {isFieldEditing ? (
              <CalendarPopover
                field={field}
                disableFuture={disableFuture}
                onChange={(date) => {
                  if (!isEditing && handleUpdate) {
                    handleUpdate({ [name]: date } as unknown as TUpdateInput)
                    setInternalEditing(null)
                  }
                }}
              />
            ) : (
              <div className="text-sm py-2 rounded-md cursor-pointer px-1 w-full hover:bg-accent" onClick={handleClick}>
                {value ? formatDate(value) : <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
