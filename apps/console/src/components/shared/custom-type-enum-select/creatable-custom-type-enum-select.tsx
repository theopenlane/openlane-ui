'use client'

import { type Ref, useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface CreatableCustomTypeEnumSelectProps {
  value?: string
  options: CustomTypeEnumOption[]
  onValueChange: (value: string) => void | Promise<void>
  onCreateOption?: (value: string) => Promise<void>
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  useCustomDisplay?: boolean
  triggerClassName?: string
  contentClassName?: string
  contentRef?: Ref<HTMLDivElement>
}

export const CreatableCustomTypeEnumSelect = ({
  value,
  options,
  onValueChange,
  onCreateOption,
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
    if (!onCreateOption || !trimmedSearch) return false
    return !allOptions.some((option) => option.label.toLowerCase() === trimmedSearch.toLowerCase() || option.value.toLowerCase() === trimmedSearch.toLowerCase())
  }, [allOptions, onCreateOption, trimmedSearch])

  const handleSelectValue = async (nextValue: string) => {
    setOpen(false)
    setSearchValue('')
    await Promise.resolve(onValueChange(nextValue))
  }

  const handleCreateValue = async () => {
    if (!onCreateOption) return
    if (!trimmedSearch) return

    const newOption: CustomTypeEnumOption = {
      label: trimmedSearch,
      value: trimmedSearch,
    }

    setOpen(false)
    setSearchValue('')

    try {
      await onCreateOption(trimmedSearch)
      setCreatedOptions((previous) => [...previous, newOption])
      await Promise.resolve(onValueChange(trimmedSearch))
    } catch (error) {
      errorNotification({ title: 'Failed to create option', description: parseErrorMessage(error) })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full flex justify-between font-normal border border-border bg-input rounded-md h-10 items-center px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName,
          )}
        >
          {useCustomDisplay ? <CustomTypeEnumValue value={value} options={allOptions} placeholder={placeholder} /> : <span>{allOptions.find((opt) => opt.value === value)?.label || placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} className={cn('min-w-(--radix-popover-trigger-width) w-auto p-0', contentClassName)} align="start">
        <Command
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === 'Tab') && showCreateOption) {
              event.preventDefault()
              handleCreateValue()
            }
          }}
        >
          <CommandInput placeholder={searchPlaceholder} value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty className="p-0">
              {showCreateOption && (
                <div
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={handleCreateValue}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create &quot;{trimmedSearch}&quot;</span>
                </div>
              )}
              {!showCreateOption && <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>}
            </CommandEmpty>
            <CommandGroup>
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
