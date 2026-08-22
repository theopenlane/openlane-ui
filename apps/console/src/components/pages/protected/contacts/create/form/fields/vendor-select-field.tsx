'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { Building2, X } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { type ContactFormData } from '../../../hooks/use-form-schema'

const VendorSelectField: React.FC = () => {
  const { watch, setValue } = useFormContext<ContactFormData>()
  const entityIDs = watch('entityIDs') ?? []

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const trimmed = debouncedSearch.trim()
  const { vendorNodes, isLoading } = useVendorsWithFilter({
    where: trimmed ? { or: [{ displayNameContainsFold: trimmed }, { nameContainsFold: trimmed }] } : undefined,
    // Only hit the network when the user has typed something
    enabled: trimmed.length > 0,
  })

  const availableVendors = vendorNodes.filter((v) => !entityIDs.includes(v.id))

  const select = (id: string) => {
    setValue('entityIDs', [...entityIDs, id], { shouldDirty: true })
  }

  const deselect = (id: string) => {
    setValue(
      'entityIDs',
      entityIDs.filter((x) => x !== id),
      { shouldDirty: true },
    )
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {trimmed && (
        <div className="rounded-md border border-border divide-y divide-border max-h-48 overflow-y-auto">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : availableVendors.length > 0 ? (
            availableVendors.map((v) => {
              const label = v.displayName || v.name || v.id
              return (
                <button key={v.id} type="button" onClick={() => select(v.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {label}
                </button>
              )
            })
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground italic">No vendors found</p>
          )}
        </div>
      )}

      {entityIDs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entityIDs.map((id) => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1 pr-1">
              <Building2 className="h-3 w-3" />
              {vendorNodes.find((v) => v.id === id)?.displayName || vendorNodes.find((v) => v.id === id)?.name || id}
              <button type="button" onClick={() => deselect(id)} className="ml-1 rounded-full hover:text-destructive transition-colors" aria-label={`Remove vendor`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default VendorSelectField
