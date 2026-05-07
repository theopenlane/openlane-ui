'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Button } from '@repo/ui/button'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import type { MergeSearchHookResult } from './types'

type Props = {
  placeholder: string
  excludeId: string
  selectedId: string | null
  selectedLabel?: string
  onSelect: (id: string, label: string) => void
  useSearchRecords: (search: string, excludeId: string) => MergeSearchHookResult
}

export const SecondaryRecordPicker = ({ placeholder, excludeId, selectedId, selectedLabel, onSelect, useSearchRecords }: Props) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const { options, isLoading } = useSearchRecords(debouncedSearch, excludeId)
  const visibleOptions = useMemo(() => options.filter((o) => o.label != null && o.label.trim() !== ''), [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between" aria-expanded={open}>
          <span className={selectedId ? '' : 'text-muted-foreground'}>{selectedId ? (selectedLabel ?? selectedId) : placeholder}</span>
          <ChevronsUpDown size={16} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name or email…" value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : visibleOptions.length === 0 ? (
              <CommandEmpty>No matches found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {visibleOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      onSelect(option.id, option.label)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.sublabel && <span className="text-xs text-muted-foreground">{option.sublabel}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
