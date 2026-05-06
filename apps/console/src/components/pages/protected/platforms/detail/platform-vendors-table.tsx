'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Building2 } from 'lucide-react'
import { toBase64DataUri } from '@/lib/image-utils'
import ViewVendorSheet from '@/components/pages/protected/vendors/view-vendor-sheet'
import { VendorStatusBadge } from '@/components/shared/enum-mapper/vendor-enum'
import { type EntityEntityStatus } from '@repo/codegen/src/schema'

type VendorNode = {
  id: string
  name?: string | null
  displayName?: string | null
  status?: EntityEntityStatus | null
  logoFile?: { base64?: string | null } | null
}

interface PlatformVendorsTableProps {
  platformId: string
  inScopeVendors: VendorNode[]
  outOfScopeVendors: VendorNode[]
  canEdit: boolean
}

const VendorRow: React.FC<{ vendor: VendorNode; outOfScope?: boolean; onClick: () => void }> = ({ vendor, outOfScope, onClick }) => {
  const logo = vendor.logoFile?.base64 ? toBase64DataUri(vendor.logoFile.base64) : undefined
  const label = vendor.displayName ?? vendor.name ?? vendor.id

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${outOfScope ? 'opacity-60' : ''}`} onClick={onClick}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={label} className="h-full w-full object-contain p-0.5" />
        ) : (
          <Building2 size={16} className="text-muted-foreground" />
        )}
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      {vendor.status && <VendorStatusBadge status={vendor.status} />}
      {outOfScope && (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Out of scope
        </Badge>
      )}
    </div>
  )
}

const PlatformVendorsTable: React.FC<PlatformVendorsTableProps> = ({ inScopeVendors, outOfScopeVendors }) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
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
    <>
      <div className="space-y-4">
        {inScopeVendors.length > 0 && (
          <div className="rounded-md border">
            <div className="px-4 py-2 bg-muted/30 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Scope ({inScopeVendors.length})</span>
            </div>
            {inScopeVendors.map((vendor) => (
              <VendorRow key={vendor.id} vendor={vendor} onClick={() => setSelectedVendorId(vendor.id)} />
            ))}
          </div>
        )}
        {outOfScopeVendors.length > 0 && (
          <div className="rounded-md border">
            <div className="px-4 py-2 bg-muted/30 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Out of Scope ({outOfScopeVendors.length})</span>
            </div>
            {outOfScopeVendors.map((vendor) => (
              <VendorRow key={vendor.id} vendor={vendor} outOfScope onClick={() => setSelectedVendorId(vendor.id)} />
            ))}
          </div>
        )}
      </div>

      <ViewVendorSheet entityId={selectedVendorId} onClose={() => setSelectedVendorId(null)} />
    </>
  )
}

export default PlatformVendorsTable
