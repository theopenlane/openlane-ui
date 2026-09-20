'use client'

import { type Ref, useMemo, useState } from 'react'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface CreatableCustomTypeEnumSelectProps {
  triggerId?: string
  value?: string
  options: CustomTypeEnumOption[]
  onValueChange: (value: string) => void | Promise<void>
  onCreateOption?: (value: string) => Promise<void>
  allowCreate?: boolean
  clearable?: boolean
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  useCustomDisplay?: boolean
  triggerClassName?: string
  contentClassName?: string
  contentRef?: Ref<HTMLDivElement>
}

export const CreatableCustomTypeEnumSelect = ({
  triggerId,
  value,
  options,
  onValueChange,
  onCreateOption,
  allowCreate,
  clearable = false,
  placeholder = 'Select',
  searchPlaceholder = 'Search...',
  disabled = false,
  useCustomDisplay = true,
  triggerClassName,
  contentClassName,
  contentRef,
}: CreatableCustomTypeEnumSelectProps) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [createdOptions, setCreatedOptions] = useState<CustomTypeEnumOption[]>([])
  const { errorNotification } = useNotification()

  const canCreate = allowCreate ?? !!onCreateOption

  const allOptions = useMemo(() => {
    const combined = [...options, ...createdOptions]
    const seen = new Set<string>()
    return combined.filter((option) => {
      if (seen.has(option.value)) return false
      seen.add(option.value)
      return true
    })
  }, [options, createdOptions])

  const trimmedSearch = searchValue.trim()

  const showCreateOption = useMemo(() => {
    if (!canCreate || !trimmedSearch) return false
    return !allOptions.some((option) => option.label.toLowerCase() === trimmedSearch.toLowerCase() || option.value.toLowerCase() === trimmedSearch.toLowerCase())
  }, [allOptions, canCreate, trimmedSearch])

  const handleSelectValue = async (nextValue: string) => {
    setOpen(false)
    setSearchValue('')
    await Promise.resolve(onValueChange(nextValue))
  }

  const handleCreateValue = async () => {
    if (!showCreateOption) return

    const newOption: CustomTypeEnumOption = {
      label: trimmedSearch,
      value: trimmedSearch,
    }

    setOpen(false)
    setSearchValue('')

    try {
      await onCreateOption?.(trimmedSearch)
      setCreatedOptions((previous) => [...previous, newOption])
      await Promise.resolve(onValueChange(trimmedSearch))
    } catch (error) {
      errorNotification({ title: 'Failed to create option', description: parseErrorMessage(error) })
    }
  }

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          className={cn(
            'w-full flex justify-between font-normal border border-border bg-input rounded-md h-10 items-center px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName,
          )}
        >
          {useCustomDisplay ? <CustomTypeEnumValue value={value} options={allOptions} placeholder={placeholder} /> : <span>{allOptions.find((opt) => opt.value === value)?.label || placeholder}</span>}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} className={cn('min-w-(--radix-popover-trigger-width) w-auto p-0 flex flex-col', contentClassName)} align="start">
        <Command>
          <CommandInput className="text-muted-foreground" placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            {!showCreateOption && (
              <CommandEmpty className="p-0">
                <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
              </CommandEmpty>
            )}
            <CommandGroup>
              {clearable && value && (
                <CommandItem value="None" onSelect={() => handleSelectValue('')}>
                  <X className="mr-2 h-4 w-4" />
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
              )}
              {allOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    handleSelectValue(option.value)
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {useCustomDisplay ? <CustomTypeEnumOptionChip option={option} /> : <span>{option.label}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreateOption && (
              <CommandGroup forceMount value="create-option-group" className="border-t">
                <CommandItem forceMount value="create-option" onSelect={handleCreateValue} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create &quot;{trimmedSearch}&quot;</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
