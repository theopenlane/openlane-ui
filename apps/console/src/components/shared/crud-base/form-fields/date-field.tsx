'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '../generic-sheet'
import { formatDate } from '@/utils/date'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

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
  icon?: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  labelClassName?: string
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
  icon,
  layout = 'vertical',
  labelClassName,
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
        <FormItem className={cn(className, layout === 'horizontal' ? 'flex items-center justify-between gap-4 space-y-0' : '')}>
          <div className="flex items-center gap-2 shrink-0">
            {icon}
            <FormLabel className={cn(layout === 'horizontal' && 'mb-0!', labelClassName)}>{label}</FormLabel>
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
              <div className={cn('text-sm py-2 rounded-md cursor-pointer px-1 w-full hover:bg-accent', layout === 'horizontal' && 'text-right')} onClick={handleClick}>
                {value ? formatDate(value) : <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
