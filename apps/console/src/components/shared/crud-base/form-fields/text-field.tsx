'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '../generic-sheet'
import { formatDate, formatCurrency } from '@/utils/date'
import { ExternalLink } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { normalizeUrl } from '@/utils/normalizeUrl'
import { cn } from '@repo/ui/lib/utils'

interface TextFieldProps<TUpdateInput> {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  placeholder?: string
  type?: string
  prefix?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  initialValue?: string
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  className?: string
  error?: string
  tooltipContent?: string
  icon?: React.ReactNode
  layout?: 'vertical' | 'horizontal'
  labelClassName?: string
  multiline?: boolean
}

export const TextField = <TUpdateInput,>({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  placeholder,
  type = 'text',
  prefix,
  internalEditing,
  setInternalEditing,
  initialValue,
  handleUpdate,
  className,
  error,
  tooltipContent,
  icon,
  layout = 'vertical',
  labelClassName,
  multiline = false,
}: TextFieldProps<TUpdateInput>) => {
  const { control, getValues, formState } = useFormContext()

  const isFieldEditing = isCreate || isEditing || internalEditing === name
  const value = data?.[name] ?? initialValue ?? ''

  const handleBlur = async () => {
    if (isEditing) return

    const newValue = getValues(name)
    const oldValue = data?.[name] ?? initialValue ?? ''

    if (newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ [name]: newValue } as unknown as TUpdateInput))
    }

    setInternalEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleTextareaBlur = async () => {
    if (isEditing) return

    const newValue = getValues(name)
    const oldValue = data?.[name] ?? initialValue ?? ''

    if (!newValue || newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ [name]: newValue } as unknown as TUpdateInput))
    }

    setInternalEditing(null)
  }

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(name)
    }
  }

  if (type === 'currency') {
    prefix = '$'
  } else if (type === 'link') {
    prefix = 'https://'
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
              multiline ? (
                <Textarea {...field} value={field.value ?? ''} placeholder={placeholder} onBlur={handleTextareaBlur} autoFocus={internalEditing === name} rows={4} />
              ) : (
                <Input {...field} value={field.value ?? ''} type={type} prefix={prefix} placeholder={placeholder} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus={internalEditing === name} />
              )
            ) : (
              <div className={cn('text-sm py-2 rounded-md cursor-pointer px-1 w-full hover:bg-accent', layout === 'horizontal' && 'text-right')} onClick={handleClick}>
                {type === 'date' ? (
                  value ? (
                    formatDate(value)
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )
                ) : type === 'currency' ? (
                  formatCurrency(value)
                ) : type === 'link' ? (
                  value ? (
                    <a href={normalizeUrl(value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 min-w-0 max-w-full" onClick={(e) => e.stopPropagation()}>
                      <span className="truncate" title={normalizeUrl(value)}>
                        {normalizeUrl(value)}
                      </span>
                      <ExternalLink className="w-4 h-4 ml-1 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )
                ) : (
                  value || <span className="text-muted-foreground italic">Not set</span>
                )}
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
