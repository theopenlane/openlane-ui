'use client'

import { useRef } from 'react'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type InternalEditingType } from '../generic-sheet'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { cn } from '@repo/ui/lib/utils'
import { fieldItemLayoutClassName, fieldMessageLayoutClassName, type TFieldLayout } from './field-layout'
import { InlineEditDisplay } from './inline-edit-display'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'

interface SelectFieldProps<TUpdateInput> {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  options: Array<{ label: string; value: string }>
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  onCreateOption?: (value: string) => Promise<void>
  useCustomDisplay?: boolean
  tooltipContent?: string
  icon?: React.ReactNode
  layout?: TFieldLayout
  labelClassName?: string
  triggerClassName?: string
  placeholder?: string
  renderValue?: (value: string) => React.ReactNode
  renderOption?: (value: string) => React.ReactNode
}

export const SelectField = <TUpdateInput,>({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  options,
  handleUpdate,
  internalEditing,
  setInternalEditing,
  onCreateOption,
  useCustomDisplay = true,
  tooltipContent,
  icon,
  layout = 'vertical',
  labelClassName,
  triggerClassName,
  placeholder,
  renderValue,
  renderOption,
}: SelectFieldProps<TUpdateInput>) => {
  const { control } = useFormContext()
  const rawValue = data?.[name]

  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isInlineEditing = isFieldEditing && !isCreate && !isEditing
  const closeInlineEdit = () => setInternalEditing(null)
  useClickOutsideWithPortal(closeInlineEdit, { refs: { triggerRef, contentRef }, enabled: isInlineEditing })
  useEscapeKey(closeInlineEdit, { enabled: isInlineEditing })

  const handleValueChange = async (onChange: (value: string) => void, value: string) => {
    onChange(value)
    setInternalEditing(null)
    if (!isEditing && !isCreate && handleUpdate) await handleUpdate({ [name]: value } as TUpdateInput)
  }

  const displayValue = options.find((opt) => opt.value === rawValue)?.label || rawValue

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={fieldItemLayoutClassName(layout)}>
          <div className="flex items-center gap-2 shrink-0">
            {icon}
            <FormLabel className={cn(layout === 'horizontal' && 'mb-0!', labelClassName)}>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          {shouldShowInput ? (
            <div ref={triggerRef} className="w-full min-w-0">
              <FormControl>
                {onCreateOption ? (
                  <CreatableCustomTypeEnumSelect
                    itemLabel={label.toLowerCase()}
                    contentRef={contentRef}
                    placeholder={placeholder}
                    value={field.value ?? undefined}
                    options={options}
                    onCreateOption={onCreateOption}
                    useCustomDisplay={useCustomDisplay}
                    onValueChange={(val) => handleValueChange(field.onChange, val)}
                  />
                ) : (
                  <Select value={field.value ?? undefined} onValueChange={(val) => handleValueChange(field.onChange, val)}>
                    <FormControl>
                      <SelectTrigger className={cn('w-full', triggerClassName)}>
                        <SelectValue placeholder={placeholder ?? 'Select'}>
                          {renderOption && field.value ? (
                            renderOption(field.value)
                          ) : useCustomDisplay ? (
                            <CustomTypeEnumValue value={field.value} options={options} placeholder={field.value} />
                          ) : (
                            <span>{options.find((opt) => opt.value === field.value)?.label ?? field.value}</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent ref={contentRef}>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {renderOption ? renderOption(o.value) : useCustomDisplay ? <CustomTypeEnumOptionChip option={o} /> : <span>{o.label}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
            </div>
          ) : (
            <InlineEditDisplay
              className={cn('text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full', layout === 'horizontal' && 'flex justify-end')}
              onActivate={() => {
                if (isEditAllowed) {
                  setInternalEditing(name)
                }
              }}
            >
              {renderValue && rawValue ? (
                renderValue(rawValue)
              ) : useCustomDisplay ? (
                rawValue ? (
                  <CustomTypeEnumValue value={rawValue} options={options} placeholder={rawValue} />
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )
              ) : (
                displayValue || <span className="text-muted-foreground italic">Not set</span>
              )}
            </InlineEditDisplay>
          )}
          <FormMessage className={fieldMessageLayoutClassName(layout)} />
        </FormItem>
      )}
    />
  )
}
