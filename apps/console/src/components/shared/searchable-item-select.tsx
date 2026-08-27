'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { cn } from '@repo/ui/lib/utils'

export type SearchableItem = { id: string; name: string }

const noDisabledIds: ReadonlySet<string> = new Set()

interface SearchableItemSelectProps {
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  items: SearchableItem[]
  isLoading: boolean
  icon: React.ReactNode
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  multiple?: boolean
  onSearchTextChange?: (value: string) => void
  filterItems?: boolean
  disabledIds?: ReadonlySet<string>
  renderDisabledItem?: (item: React.ReactNode, id: string) => React.ReactNode
}

export const SearchableItemSelect: React.FC<SearchableItemSelectProps> = ({
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
  filterItems = true,
  disabledIds = noDisabledIds,
  renderDisabledItem,
}) => {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [cache, setCache] = useState<Map<string, SearchableItem>>(() => new Map())

  useEffect(() => {
    setCache((previous) => {
      const next = new Map(previous)
      let changed = false

      for (const item of items) {
        if (!next.has(item.id)) {
          next.set(item.id, item)
          changed = true
        }
      }

      return changed ? next : previous
    })
  }, [items])

  const selectedItems = useMemo(() => selectedIds.map((id) => cache.get(id)).filter((item): item is SearchableItem => item !== undefined), [cache, selectedIds])
  const filteredItems = useMemo(() => {
    if (!filterItems) return items

    const query = searchText.trim().toLowerCase()
    return query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items
  }, [filterItems, items, searchText])

  const updateSearchText = (value: string) => {
    setSearchText(value)
    onSearchTextChange?.(value)
  }

  const select = (item: SearchableItem) => {
    setCache((previous) => new Map(previous).set(item.id, item))

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-left text-sm">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <Badge key={item.id} variant="outline" className="flex items-center gap-1 pr-1">
                <span>{item.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${item.name}`}
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(item.id)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.stopPropagation()
                      remove(item.id)
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={searchText} onValueChange={updateSearchText} />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Loading...' : emptyMessage}</CommandEmpty>
            {filteredItems.length > 0 && (
              <CommandGroup>
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  const isDisabled = disabledIds.has(item.id)
                  const row = (
                    <CommandItem key={item.id} value={`${item.name} ${item.id}`} disabled={isDisabled} onSelect={() => !isDisabled && select(item)}>
                      <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="mr-2 text-muted-foreground">{icon}</span>
                      <span>{item.name}</span>
                    </CommandItem>
                  )

                  return isDisabled && renderDisabledItem ? <React.Fragment key={item.id}>{renderDisabledItem(row, item.id)}</React.Fragment> : row
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
