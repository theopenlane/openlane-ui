'use client'

import React, { useId, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { onActivateKeyDown } from '@repo/ui/lib/a11y'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'
import { cn } from '@repo/ui/lib/utils'

export type SearchableItem = { id: string; name: string }

interface SearchableItemSelectProps<TItem extends SearchableItem> {
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  items: TItem[]
  isLoading: boolean
  icon: React.ReactNode
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  multiple?: boolean
  onSearchTextChange?: (value: string) => void
  filterItems?: boolean
  knownItems?: TItem[]
  disabledReason?: (item: TItem) => string | undefined
  renderItemEnd?: (item: TItem) => React.ReactNode
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export const SearchableItemSelect = <TItem extends SearchableItem>({
  selectedIds,
  onSelectedIdsChange,
  items,
  isLoading,
  icon,
  placeholder,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  multiple = true,
  onSearchTextChange,
  filterItems = false,
  knownItems,
  disabledReason,
  renderItemEnd,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: SearchableItemSelectProps<TItem>) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [retainedItems, setRetainedItems] = useState<TItem[]>([])
  const listId = useId()

  const itemsById = useMemo(() => new Map([...retainedItems, ...(knownItems ?? []), ...items].map((item) => [item.id, item])), [items, knownItems, retainedItems])
  const selectedItems = selectedIds.map((id) => itemsById.get(id)).filter((item): item is TItem => item !== undefined)
  const filteredItems = useMemo(() => {
    if (!filterItems) return items

    const query = searchText.trim().toLowerCase()
    return query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items
  }, [filterItems, items, searchText])

  const updateSearchText = (value: string) => {
    setSearchText(value)
    onSearchTextChange?.(value)
  }

  const select = (item: TItem) => {
    setRetainedItems((previous) => (previous.some((retained) => retained.id === item.id) ? previous : [...previous, item]))

    if (multiple) {
      onSelectedIdsChange(selectedIds.includes(item.id) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id])
      return
    }

    onSelectedIdsChange([item.id])
    updateSearchText('')
    setOpen(false)
  }

  const remove = (itemId: string) => {
    onSelectedIdsChange(selectedIds.filter((id) => id !== itemId))
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      updateSearchText('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          tabIndex={0}
          onKeyDown={onActivateKeyDown(() => setOpen(true))}
          className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <Badge key={item.id} variant="outline" className="flex items-center gap-1 pr-1">
                <span>{item.name}</span>
                <Button
                  type="button"
                  variant="transparent"
                  aria-label={`Remove ${item.name}`}
                  className="h-3 w-3 p-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(item.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={searchText} onValueChange={updateSearchText} />
          <CommandList id={listId}>
            <CommandEmpty>{isLoading ? 'Loading...' : emptyMessage}</CommandEmpty>
            {filteredItems.length > 0 && (
              <CommandGroup>
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  const unavailableReason = disabledReason?.(item)
                  const row = (
                    <CommandItem key={item.id} value={`${item.name} ${item.id}`} disabled={!!unavailableReason} onSelect={() => !unavailableReason && select(item)}>
                      <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-btn-primary-text' : 'opacity-50')}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="mr-2 text-muted-foreground">{icon}</span>
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                      {renderItemEnd && <span className="ml-auto shrink-0">{renderItemEnd(item)}</span>}
                    </CommandItem>
                  )

                  if (!unavailableReason) return row

                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div>{row}</div>
                      </TooltipTrigger>
                      <TooltipContent portal side="top" align="center" sideOffset={-4}>
                        {unavailableReason}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
