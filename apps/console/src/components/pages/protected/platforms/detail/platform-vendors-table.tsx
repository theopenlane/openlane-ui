'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Building2 } from 'lucide-react'

type VendorNode = {
  id: string
  name?: string | null
  displayName?: string | null
  status?: unknown
}

interface PlatformVendorsTableProps {
  platformId: string
  inScopeVendors: VendorNode[]
  outOfScopeVendors: VendorNode[]
  canEdit: boolean
}

const VendorRow: React.FC<{ vendor: VendorNode; outOfScope?: boolean }> = ({ vendor, outOfScope }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${outOfScope ? 'opacity-60' : ''}`}>
    <Building2 size={16} className="text-muted-foreground shrink-0" />
    <span className="text-sm font-medium flex-1">{vendor.displayName ?? vendor.name ?? vendor.id}</span>
    {!!vendor.status && (
      <Badge variant="secondary" className="text-xs">
        {String(vendor.status)}
      </Badge>
    )}
    {outOfScope && (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Out of scope
      </Badge>
    )}
  </div>
)

const PlatformVendorsTable: React.FC<PlatformVendorsTableProps> = ({ inScopeVendors, outOfScopeVendors }) => {
  const hasVendors = inScopeVendors.length > 0 || outOfScopeVendors.length > 0

  if (!hasVendors) {
    return (
      <div className="rounded-md border p-8 text-center">
        <Building2 size={32} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No vendors linked to this platform.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {inScopeVendors.length > 0 && (
        <div className="rounded-md border">
          <div className="px-4 py-2 bg-muted/30 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Scope ({inScopeVendors.length})</span>
          </div>
          {inScopeVendors.map((vendor) => (
            <VendorRow key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
      {outOfScopeVendors.length > 0 && (
        <div className="rounded-md border">
          <div className="px-4 py-2 bg-muted/30 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Out of Scope ({outOfScopeVendors.length})</span>
          </div>
          {outOfScopeVendors.map((vendor) => (
            <VendorRow key={vendor.id} vendor={vendor} outOfScope />
          ))}
        </div>
      )}
    </div>
  )
}

export default PlatformVendorsTable
