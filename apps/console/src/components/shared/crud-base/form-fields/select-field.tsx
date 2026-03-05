'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FieldValues, useFormContext } from 'react-hook-form'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { useMemo, useState } from 'react'
import { Plus, InfoIcon, Check, ChevronsUpDown } from 'lucide-react'
import { InternalEditingType } from '../generic-sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'

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

  if (onCreateOption) {
    return (
      <CreatableSelectField
        name={name}
        label={label}
        shouldShowInput={shouldShowInput}
        isEditAllowed={isEditAllowed}
        options={options}
        handleUpdate={handleUpdate}
        setInternalEditing={setInternalEditing}
        onCreateOption={onCreateOption}
        useCustomDisplay={useCustomDisplay}
        tooltipContent={tooltipContent}
        displayValue={displayValue}
      />
    )
  }

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
              <Select
                value={field.value}
                onValueChange={async (val) => {
                  field.onChange(val)
                  if (handleUpdate) {
                    await Promise.resolve(handleUpdate({ [name]: val } as unknown as TUpdateInput))
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
            ) : (
              <div
                className="text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {displayValue || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function CreatableSelectField<TUpdateInput>({
  name,
  label,
  shouldShowInput,
  isEditAllowed,
  options,
  handleUpdate,
  setInternalEditing,
  onCreateOption,
  useCustomDisplay = true,
  tooltipContent,
  displayValue,
}: {
  name: string
  label: string
  shouldShowInput: boolean
  isEditAllowed: boolean
  options: Array<{ label: string; value: string }>
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  setInternalEditing: InternalEditingType
  onCreateOption: (value: string) => Promise<void>
  useCustomDisplay?: boolean
  tooltipContent?: string
  displayValue: string
}) {
  const { control } = useFormContext()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [createdOptions, setCreatedOptions] = useState<Array<{ label: string; value: string }>>([])

  const allOptions = useMemo(() => {
    const combined = [...options, ...createdOptions]
    const seen = new Set<string>()
    return combined.filter((option) => {
      if (seen.has(option.value)) return false
      seen.add(option.value)
      return true
    })
  }, [options, createdOptions])

  const showCreateOption = useMemo(() => {
    if (!searchValue.trim()) return false
    return !allOptions.some((option) => option.label.toLowerCase() === searchValue.toLowerCase())
  }, [searchValue, allOptions])

  const handleCreateNew = async (val: string, onChange: (val: string) => void) => {
    const trimmedVal = val.trim()
    if (!trimmedVal) return

    const newOption = { label: trimmedVal, value: trimmedVal }
    setCreatedOptions((prev) => [...prev, newOption])
    onChange(trimmedVal)
    setOpen(false)
    setSearchValue('')

    await onCreateOption(trimmedVal)

    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ [name]: trimmedVal } as unknown as TUpdateInput))
    }
    setInternalEditing(null)
  }

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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full flex justify-between font-normal border border-border bg-input rounded-md h-10 items-center px-3 text-sm"
                  >
                    {useCustomDisplay ? (
                      <CustomTypeEnumValue value={field.value} options={allOptions} placeholder="Select" />
                    ) : (
                      <span>{allOptions.find((opt) => opt.value === field.value)?.label || 'Select'}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === 'Tab') && showCreateOption) {
                        e.preventDefault()
                        handleCreateNew(searchValue, field.onChange)
                      }
                    }}
                  >
                    <CommandInput placeholder={`Search ${label.toLowerCase()}...`} value={searchValue} onValueChange={setSearchValue} />
                    <CommandList>
                      <CommandEmpty className="p-0">
                        {showCreateOption && (
                          <div
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleCreateNew(searchValue, field.onChange)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create &quot;{searchValue}&quot;</span>
                          </div>
                        )}
                        {!showCreateOption && <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>}
                      </CommandEmpty>
                      <CommandGroup>
                        {allOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={async () => {
                              field.onChange(option.value)
                              setOpen(false)
                              setSearchValue('')
                              if (handleUpdate) {
                                await Promise.resolve(handleUpdate({ [name]: option.value } as unknown as TUpdateInput))
                              }
                              setInternalEditing(null)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', field.value === option.value ? 'opacity-100' : 'opacity-0')} />
                            {useCustomDisplay ? <CustomTypeEnumOptionChip option={option} /> : <span>{option.label}</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div
                className="text-sm py-2 rounded-md cursor-pointer hover:bg-accent px-1 w-full"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {displayValue || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
