'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Badge } from '@repo/ui/badge'
import { Check, Laptop, Building2, X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useEntitiesWithFilter } from '@/lib/graphql-hooks/entity'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

type ItemInfo = { id: string; name: string }

interface MultiSelectProps {
  fieldName: keyof Pick<EditPlatformFormData, 'assetIDs' | 'outOfScopeAssetIDs' | 'entityIDs' | 'outOfScopeVendorIDs'>
  label: string
  placeholder: string
  items: ItemInfo[]
  isLoading: boolean
  icon: React.ReactNode
}

const MultiSelectField: React.FC<MultiSelectProps> = ({ fieldName, label, placeholder, items, isLoading, icon }) => {
  const form = useFormContext<EditPlatformFormData>()
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [cache, setCache] = useState<Map<string, ItemInfo>>(() => new Map())

  const watchedIDs = form.watch(fieldName) as string[] | undefined
  const selectedIds = useMemo(() => watchedIDs ?? [], [watchedIDs])

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

  const selectedItems = useMemo(() => selectedIds.map((id) => cache.get(id)).filter(Boolean) as ItemInfo[], [selectedIds, cache])

  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase())), [items, searchText])

  const toggle = (item: ItemInfo) => {
    const current = (form.getValues(fieldName) as string[]) ?? []
    if (current.includes(item.id)) {
      form.setValue(fieldName, current.filter((id) => id !== item.id) as never)
    } else {
      setCache((prev) => new Map(prev).set(item.id, item))
      form.setValue(fieldName, [...current, item.id] as never)
    }
  }

  const remove = (itemId: string) => {
    const current = (form.getValues(fieldName) as string[]) ?? []
    form.setValue(fieldName, current.filter((id) => id !== itemId) as never)
  }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem>
          <FormLabel className="block">{label}</FormLabel>
          <FormControl>
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
                    <span className="text-muted-foreground">{placeholder}</span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) border bg-input! p-0" side="bottom" align="start" sideOffset={4}>
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search..." value={searchText} onValueChange={setSearchText} />
                  <CommandList>
                    <CommandEmpty>{isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>
                    {filteredItems.length > 0 && (
                      <CommandGroup>
                        {filteredItems.map((item) => {
                          const isSelected = selectedIds.includes(item.id)
                          return (
                            <CommandItem key={item.id} value={item.id} onSelect={() => toggle(item)}>
                              <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'opacity-50')}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="mr-2 text-muted-foreground">{icon}</span>
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
          </FormControl>
        </FormItem>
      )}
    />
  )
}

const StepLinkAssetsVendors: React.FC = () => {
  const { assetsNodes, isLoading: assetsLoading } = useAssetsWithFilter({ enabled: true })
  const { entitiesNodes: vendorNodes, isLoading: vendorsLoading } = useEntitiesWithFilter({
    where: { hasEntityTypeWith: [{ name: 'vendor' }] },
    enabled: true,
  })

  const assets = useMemo(() => assetsNodes.map((a) => ({ id: a.id, name: a.name ?? a.id })), [assetsNodes])
  const vendors = useMemo(() => vendorNodes.map((v) => ({ id: v.id, name: v.displayName ?? v.name ?? v.id })), [vendorNodes])

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Create to skip.</p>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Assets</h4>
        <MultiSelectField fieldName="assetIDs" label="In-scope Assets" placeholder="Select assets in scope..." items={assets} isLoading={assetsLoading} icon={<Laptop className="h-4 w-4" />} />
        <MultiSelectField
          fieldName="outOfScopeAssetIDs"
          label="Out-of-scope Assets"
          placeholder="Select assets out of scope..."
          items={assets}
          isLoading={assetsLoading}
          icon={<Laptop className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Vendors</h4>
        <MultiSelectField fieldName="entityIDs" label="In-scope Vendors" placeholder="Select vendors in scope..." items={vendors} isLoading={vendorsLoading} icon={<Building2 className="h-4 w-4" />} />
        <MultiSelectField
          fieldName="outOfScopeVendorIDs"
          label="Out-of-scope Vendors"
          placeholder="Select vendors out of scope..."
          items={vendors}
          isLoading={vendorsLoading}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

export default StepLinkAssetsVendors
