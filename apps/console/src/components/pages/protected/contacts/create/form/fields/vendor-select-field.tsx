'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { Building2, Check, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { cn } from '@repo/ui/lib/utils'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { type ContactFormData } from '../../../hooks/use-form-schema'

type VendorItem = { id: string; name: string }

const VendorSelectField: React.FC = () => {
  const { watch, setValue, getValues } = useFormContext<ContactFormData>()
  const watchedEntityIDs = watch('entityIDs')
  const entityIDs = useMemo(() => watchedEntityIDs ?? [], [watchedEntityIDs])

  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 300)

  // Cache id->name so badges stay labelled after the search string is cleared
  const [cache, setCache] = useState<Map<string, VendorItem>>(() => new Map())

  const trimmed = debouncedSearch.trim()
  const { vendorNodes, isLoading } = useVendorsWithFilter({
    where: trimmed ? { or: [{ displayNameContainsFold: trimmed }, { nameContainsFold: trimmed }] } : undefined,
    enabled: trimmed.length > 0,
  })

  const items = useMemo<VendorItem[]>(() => vendorNodes.map((v) => ({ id: v.id, name: v.displayName ?? v.name ?? v.id })), [vendorNodes])

  // Keep cache warm as results arrive
  useEffect(() => {
    setCache((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const item of items) {
        if (!next.has(item.id)) {
          next.set(item.id, item)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [items])

  const selectedItems = useMemo<VendorItem[]>(() => entityIDs.map((id) => cache.get(id)).filter((v): v is VendorItem => v !== undefined), [entityIDs, cache])

  const toggle = (item: VendorItem) => {
    const current = (getValues('entityIDs') as string[]) ?? []
    if (current.includes(item.id)) {
      setValue(
        'entityIDs',
        current.filter((id) => id !== item.id),
        { shouldDirty: true },
      )
    } else {
      setCache((prev) => new Map(prev).set(item.id, item))
      setValue('entityIDs', [...current, item.id], { shouldDirty: true })
    }
  }

  const remove = (id: string) => {
    const current = (getValues('entityIDs') as string[]) ?? []
    setValue(
      'entityIDs',
      current.filter((x) => x !== id),
      { shouldDirty: true },
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border bg-input px-3 py-2 text-sm">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <Badge key={item.id} variant="outline" className="flex items-center gap-1 pr-1">
                <span>{item.name}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(item.id)
                  }}
                />
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Search vendors...</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search vendors..." value={searchText} onValueChange={setSearchText} />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Searching...' : trimmed ? 'No vendors found.' : 'Type to search vendors.'}</CommandEmpty>
            {items.length > 0 && (
              <CommandGroup>
                {items.map((item) => {
                  const isSelected = entityIDs.includes(item.id)
                  return (
                    <CommandItem key={item.id} value={item.id} onSelect={() => toggle(item)}>
                      <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{item.name}</span>
                    </CommandItem>
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

export default VendorSelectField
