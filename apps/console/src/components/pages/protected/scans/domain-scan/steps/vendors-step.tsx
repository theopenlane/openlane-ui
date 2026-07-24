'use client'

import React, { useMemo } from 'react'
import { Badge } from '@repo/ui/badge'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { EditableName } from '../editable-name'
import { SectionCard } from '../components/section-card'
import { SelectionRow } from '../components/selection-row'
import { SelectAllCheckbox } from '../components/select-all-checkbox'
import { EmptyState } from '../components/empty-state'
import { VendorLogo } from '../components/vendor-logo'
import { resolveVendorLogoUrl, withOverride } from '../notification-mappers'
import { toggleSetValue } from '../selection-utils'
import type { OverrideMap, Vendor } from '../types'

type VendorsStepProps = {
  vendors: Vendor[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}

export const VendorsStep = ({ vendors, selected, setSelected, existingIds, overrides, setOverrides }: VendorsStepProps) => {
  const sortedVendors = useMemo(
    () =>
      [...vendors].sort((a, b) => {
        const aPreSelected = existingIds.has(a.id) || Boolean(a.url)
        const bPreSelected = existingIds.has(b.id) || Boolean(b.url)
        return Number(bPreSelected) - Number(aPreSelected)
      }),
    [vendors, existingIds],
  )

  const allIds = sortedVendors.map((vendor) => vendor.id)

  return (
    <SectionCard
      title="Review vendors"
      description="Grouped from detected technologies and ASNs. Names are editable, set a domain if one is missing to pull in its logo. Vendors you already have are marked, selecting one links it instead of creating a duplicate."
      titleAction={<SelectAllCheckbox ids={allIds} selected={selected} setSelected={setSelected} />}
    >
      {sortedVendors.length === 0 ? (
        <EmptyState message="No vendors were detected in this notification." />
      ) : (
        sortedVendors.map((vendor, index) => {
          const resolved = withOverride(vendor, overrides)
          const liveLogoUrl = resolved.domain ? resolveVendorLogoUrl(resolved.domain) : vendor.logoUrl

          return (
            <React.Fragment key={vendor.id}>
              <SelectionRow
                checked={selected.has(vendor.id)}
                onCheckedChange={() => toggleSetValue(setSelected, vendor.id)}
                title={<EditableName value={resolved.name} onChange={(name) => setOverrides((prev) => ({ ...prev, [vendor.id]: { ...prev[vendor.id], name } }))} placeholder={vendor.name} />}
                leading={<VendorLogo name={resolved.name} logoUrl={liveLogoUrl} />}
                badges={vendor.providedServices}
                description={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Domain:</span>
                    <Input
                      value={resolved.domain ?? ''}
                      onChange={(event) => setOverrides((prev) => ({ ...prev, [vendor.id]: { ...prev[vendor.id], domain: event.target.value } }))}
                      placeholder="example.com"
                      className="h-7 max-w-56 text-xs"
                    />
                  </div>
                }
                trailing={existingIds.has(vendor.id) ? <Badge variant="secondary">Already added</Badge> : undefined}
              />
              {index < sortedVendors.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          )
        })
      )}
    </SectionCard>
  )
}
