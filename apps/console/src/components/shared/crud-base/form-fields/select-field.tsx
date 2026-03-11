'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type FieldValues, useFormContext } from 'react-hook-form'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type InternalEditingType } from '../generic-sheet'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

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
}: SelectFieldProps<TUpdateInput>) => {
  const { control } = useFormContext()
  const rawValue = data?.[name]

  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  const displayValue = options.find((opt) => opt.value === rawValue)?.label || rawValue

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1">
            <FormLabel>{label}</FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {shouldShowInput ? (
              onCreateOption ? (
                <CreatableCustomTypeEnumSelect
                  value={field.value}
                  options={options}
                  onCreateOption={onCreateOption}
                  useCustomDisplay={useCustomDisplay}
                  searchPlaceholder={`Search ${label.toLowerCase()}...`}
                  onValueChange={async (val) => {
                    field.onChange(val)
                    if (handleUpdate) {
                      await Promise.resolve(handleUpdate({ [name]: val } as TUpdateInput))
                    }
                    setInternalEditing(null)
                  }}
                />
              ) : (
                <Select
                  value={field.value}
                  onValueChange={async (val) => {
                    field.onChange(val)
                    if (handleUpdate) {
                      await Promise.resolve(handleUpdate({ [name]: val } as TUpdateInput))
                    }
                    setInternalEditing(null)
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {useCustomDisplay ? (
                          <CustomTypeEnumValue value={field.value} options={options} placeholder="Select" />
                        ) : (
                          <span>{options.find((opt) => opt.value === field.value)?.label || 'Select'}</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {useCustomDisplay ? <CustomTypeEnumOptionChip option={o} /> : <span>{o.label}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            ) : (
              <div
                className="text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {useCustomDisplay ? (
                  rawValue ? (
                    <CustomTypeEnumValue value={rawValue} options={options} placeholder={rawValue} />
                  ) : (
                    <span className="text-muted-foreground italic">Not set</span>
                  )
                ) : (
                  displayValue || <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
