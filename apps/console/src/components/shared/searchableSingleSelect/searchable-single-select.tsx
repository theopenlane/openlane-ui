'use client'

import { ChevronDown, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type Option } from '@repo/ui/multiple-selector'
import { cn } from '@repo/ui/lib/utils'
import { useRef, useState } from 'react'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '../custom-type-enum-chip/custom-type-enum-chip'

interface SearchableSingleSelectProps {
  value?: string
  placeholder?: string
  options: Option[]
  onChange?: (val: string) => void
  autoFocus?: boolean
  onClose?: () => void
  className?: string
  clearable?: boolean
  clearLabel?: string
  disabled?: boolean
  ariaLabel?: string
}

export const SearchableSingleSelect = ({
  value,
  placeholder = 'Select an option...',
  options,
  onChange,
  autoFocus,
  onClose,
  className,
  clearable = false,
  clearLabel = 'Unassigned',
  disabled = false,
  ariaLabel,
}: SearchableSingleSelectProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useClickOutsideWithPortal(() => onClose?.(), {
    refs: { triggerRef, popoverRef },
    enabled: Boolean(onClose),
  })

  useEscapeKey(() => onClose?.(), { enabled: Boolean(onClose) })

  return (
    <div ref={triggerRef} className={cn(className, 'w-full')}>
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            className="w-full flex text-sm text-left h-10 px-3 py-0! justify-between border bg-input rounded-md items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="truncate">
              <CustomTypeEnumValue value={value} options={options} placeholder={placeholder} />
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent ref={popoverRef} className="p-0 bg-input! border w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width)" side="bottom" align="start" sideOffset={4}>
          <Command shouldFilter autoFocus={autoFocus}>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {clearable && (
                  <CommandItem
                    key="searchable-single-select-clear"
                    value={clearLabel}
                    onSelect={() => {
                      onChange?.('')
                      setOpen(false)
                    }}
                  >
                    <span className="flex items-center gap-2 italic text-muted-foreground">
                      <X size={14} />
                      {clearLabel}
                    </span>
                  </CommandItem>
                )}
                {options.map((option, i) => (
                  <CommandItem
                    key={`option-${option.value}-${i}`}
                    value={option.value}
                    keywords={[option.label]}
                    onSelect={() => {
                      onChange?.(option.value)
                      setOpen(false)
                    }}
                  >
                    <CustomTypeEnumOptionChip option={option} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
