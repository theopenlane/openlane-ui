'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { FieldValues, useFormContext } from 'react-hook-form'
import { InternalEditingType } from '../generic-sheet'
import { formatDate, formatCurrency } from '@/utils/date'
import { ExternalLink } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { normalizeUrl } from '@/utils/normalizeUrl'

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
}: TextFieldProps<TUpdateInput>) => {
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
      await Promise.resolve(handleUpdate({ [name]: newValue } as unknown as TUpdateInput))
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
        <FormItem className={className}>
          <div className="flex items-center gap-1">
            <FormLabel>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {isFieldEditing ? (
              <Input {...field} type={type} prefix={prefix} placeholder={placeholder} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus={internalEditing === name} />
            ) : (
              <div className={`text-sm py-2 rounded-md cursor-pointer px-1 w-full` + (type !== 'link' ? ' hover:bg-accent' : '')} onClick={handleClick}>
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
                    <a
                      href={normalizeUrl(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:bg-accent bg-muted rounded-md px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {normalizeUrl(value)}
                      <ExternalLink className="w-4 h-4 ml-1" />
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
