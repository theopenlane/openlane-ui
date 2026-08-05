'use client'

import React, { useMemo, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { tzOffset } from '@date-fns/tz'
import { formatTimeZoneLabel } from '@/utils/date'

interface TimezoneSelectProps {
  value: string
  onChange: (timeZone: string) => void
  referenceDate?: Date | null
}

const TimezoneSelectInner: React.FC<TimezoneSelectProps> = ({ value, onChange, referenceDate }) => {
  const [open, setOpen] = useState(false)
  const [fallbackDate] = useState(() => new Date())
  const offsetDate = referenceDate ?? fallbackDate

  const options = useMemo(() => {
    if (!open) return []
    return [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone'), value])]
      .map((timeZone) => ({ value: timeZone, label: formatTimeZoneLabel(timeZone, offsetDate), offsetMinutes: tzOffset(timeZone, offsetDate) }))
      .sort((a, b) => a.offsetMinutes - b.offsetMinutes || (a.value < b.value ? -1 : 1))
  }, [open, offsetDate, value])

  const selectedLabel = formatTimeZoneLabel(value, offsetDate)

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-input px-3 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Globe size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search timezones..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={[option.value]}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check size={16} className="ml-auto shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const TimezoneSelect = React.memo(TimezoneSelectInner)
