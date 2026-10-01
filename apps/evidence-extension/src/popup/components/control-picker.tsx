import { useId, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { onActivateKeyDown } from '@repo/ui/lib/a11y'
import { useAsyncCommandSearch } from '@repo/ui/use-async-command-search'
import type { TConnection } from '../../lib/connection'
import { CONTROL_SEARCH_LIMIT, useControlSearch, type TControlOption } from '../hooks/use-openlane-queries'

type TControlPickerProps = {
  connection: TConnection
  value: TControlOption[]
  onChange: (value: TControlOption[]) => void
}

const frameworkLabel = (control: TControlOption) => control.referenceFramework || 'CUSTOM'

export const ControlPicker = ({ connection, value, onChange }: TControlPickerProps) => {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const { searchText, setSearchText, debouncedTerm, canQuery, getIsSearching } = useAsyncCommandSearch({ minLength: 1 })
  const { data: results = [], isFetching, isError } = useControlSearch(connection, debouncedTerm, canQuery)
  const isSearching = getIsSearching(isFetching)
  const visibleResults = canQuery && !isSearching ? results : []
  const selectedIds = new Set(value.map((control) => control.id))

  const toggle = (control: TControlOption) => onChange(selectedIds.has(control.id) ? value.filter((item) => item.id !== control.id) : [...value, control])

  const emptyMessage = () => {
    if (!searchText.trim()) return 'Type a reference code, e.g. CC6.1'
    if (isSearching) return 'Searching…'
    if (isError) return 'Controls could not be loaded.'
    return 'No controls match that reference code.'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-label="Control reference codes"
          tabIndex={0}
          onKeyDown={onActivateKeyDown(() => setOpen(true))}
          className="flex min-h-9 w-full cursor-pointer items-center gap-1 rounded-md border bg-input px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {value.length === 0 && <span className="text-muted-foreground">Select controls</span>}
            {value.map((control) => (
              <Badge key={control.id} variant="select" className="gap-1 text-sm">
                {control.refCode}
                <Button
                  variant="icon"
                  className="h-4 w-4 gap-0 p-0"
                  icon={<X />}
                  aria-label={`Remove ${control.refCode}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggle(control)
                  }}
                />
              </Badge>
            ))}
          </div>
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={searchText} onValueChange={setSearchText} searching={isSearching} placeholder="Search by reference code" />
          <CommandList id={listId}>
            <CommandEmpty>{emptyMessage()}</CommandEmpty>
            {visibleResults.map((control) => (
              <CommandItem key={control.id} value={control.id} onSelect={() => toggle(control)} className="flex items-center gap-2">
                <Check size={14} className={selectedIds.has(control.id) ? 'opacity-100' : 'opacity-0'} />
                <span className="font-medium">{control.refCode}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{frameworkLabel(control)}</span>
              </CommandItem>
            ))}
            {visibleResults.length === CONTROL_SEARCH_LIMIT && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Showing the first {CONTROL_SEARCH_LIMIT} matches. Type more to narrow the list.</p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
