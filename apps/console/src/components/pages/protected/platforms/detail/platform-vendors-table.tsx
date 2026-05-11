'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Building2 } from 'lucide-react'
import { toBase64DataUri } from '@/lib/image-utils'
import ViewVendorSheet from '@/components/pages/protected/vendors/view-vendor-sheet'
import { VendorStatusBadge } from '@/components/shared/enum-mapper/vendor-enum'
import { type EntityEntityStatus } from '@repo/codegen/src/schema'

type VendorOwnerUser = {
  id: string
  displayName?: string | null
  email?: string | null
}

type VendorOwnerGroup = {
  id: string
  displayName?: string | null
}

type VendorNode = {
  id: string
  name?: string | null
  displayName?: string | null
  status?: EntityEntityStatus | null
  logoFile?: { base64?: string | null } | null
  internalOwner?: string | null
  internalOwnerUser?: VendorOwnerUser | null
  internalOwnerGroup?: VendorOwnerGroup | null
}

interface PlatformVendorsTableProps {
  platformId: string
  inScopeVendors: VendorNode[]
  outOfScopeVendors: VendorNode[]
  canEdit: boolean
}

const HEADER_CELL = 'text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2'
const BODY_CELL = 'px-4 py-2.5 align-middle'

const renderOwnerLabel = (vendor: VendorNode) => {
  const label = vendor.internalOwnerUser?.displayName ?? vendor.internalOwnerGroup?.displayName ?? vendor.internalOwner ?? null
  if (!label) return <span className="text-muted-foreground">-</span>
  return (
    <span className="text-muted-foreground" title={vendor.internalOwnerUser?.email ?? label}>
      {label}
    </span>
  )
}

const VendorSection: React.FC<{ title: string; vendors: VendorNode[]; outOfScope?: boolean; onRowClick: (id: string) => void }> = ({ title, vendors, outOfScope, onRowClick }) => (
  <div className="rounded-md border overflow-hidden">
    <div className="px-4 py-2 bg-muted/30 border-b">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title} ({vendors.length})
      </span>
    </div>
    <table className="w-full text-sm table-fixed">
      <colgroup>
        <col />
        <col className="w-[40%]" />
        <col className="w-[160px]" />
      </colgroup>
      <thead className="bg-muted/30 border-b">
        <tr>
          <th className={HEADER_CELL}>Name</th>
          <th className={HEADER_CELL}>Internal Owner</th>
          <th className={`${HEADER_CELL} text-right`}>Status</th>
        </tr>
      </thead>
      <tbody>
        {vendors.map((vendor) => {
          const logo = vendor.logoFile?.base64 ? toBase64DataUri(vendor.logoFile.base64) : undefined
          const label = vendor.displayName ?? vendor.name ?? vendor.id
          return (
            <tr key={vendor.id} onClick={() => onRowClick(vendor.id)} className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${outOfScope ? 'opacity-60' : ''}`}>
              <td className={BODY_CELL}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={label} className="h-full w-full object-contain p-0.5" />
                    ) : (
                      <Building2 size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-medium truncate">{label}</span>
                </div>
              </td>
              <td className={`${BODY_CELL} text-xs truncate`}>{renderOwnerLabel(vendor)}</td>
              <td className={`${BODY_CELL} text-right`}>
                <div className="flex items-center gap-2 justify-end">
                  {vendor.status && <VendorStatusBadge status={vendor.status} />}
                  {outOfScope && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Out of scope
                    </Badge>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

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
        {inScopeVendors.length > 0 && <VendorSection title="In Scope" vendors={inScopeVendors} onRowClick={setSelectedVendorId} />}
        {outOfScopeVendors.length > 0 && <VendorSection title="Out of Scope" vendors={outOfScopeVendors} outOfScope onRowClick={setSelectedVendorId} />}
      </div>

      <ViewVendorSheet entityId={selectedVendorId} onClose={() => setSelectedVendorId(null)} />
    </>
  )
}

export default PlatformVendorsTable
