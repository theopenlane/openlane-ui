'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Laptop } from 'lucide-react'
import ViewAssetSheet from '@/components/pages/protected/assets/view-asset-sheet'

type AssetOwnerUser = {
  id: string
  displayName?: string | null
  email?: string | null
}

type AssetOwnerGroup = {
  id: string
  displayName?: string | null
}

type AssetNode = {
  id: string
  name?: string | null
  assetType?: unknown
  internalOwner?: string | null
  internalOwnerUser?: AssetOwnerUser | null
  internalOwnerGroup?: AssetOwnerGroup | null
}

interface PlatformAssetsTableProps {
  platformId: string
  inScopeAssets: AssetNode[]
  outOfScopeAssets: AssetNode[]
  canEdit: boolean
}

const HEADER_CELL = 'text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2'
const BODY_CELL = 'px-4 py-2.5 align-middle'

const renderOwnerLabel = (asset: AssetNode) => {
  const label = asset.internalOwnerUser?.displayName ?? asset.internalOwnerGroup?.displayName ?? asset.internalOwner ?? null
  if (!label) return <span className="text-muted-foreground">-</span>
  return (
    <span className="text-muted-foreground" title={asset.internalOwnerUser?.email ?? label}>
      {label}
    </span>
  )
}

const AssetSection: React.FC<{ title: string; assets: AssetNode[]; outOfScope?: boolean; onRowClick: (id: string) => void }> = ({ title, assets, outOfScope, onRowClick }) => (
  <div className="rounded-md border overflow-hidden">
    <div className="px-4 py-2 bg-muted/30 border-b">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title} ({assets.length})
      </span>
    </div>
    <table className="w-full text-sm table-fixed">
      <colgroup>
        <col />
        <col className="w-[35%]" />
        <col className="w-[220px]" />
      </colgroup>
      <thead className="bg-muted/30 border-b">
        <tr>
          <th className={HEADER_CELL}>Name</th>
          <th className={HEADER_CELL}>Internal Owner</th>
          <th className={`${HEADER_CELL} text-right`}>Type</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <tr key={asset.id} onClick={() => onRowClick(asset.id)} className={`border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${outOfScope ? 'opacity-60' : ''}`}>
            <td className={BODY_CELL}>
              <div className="flex items-center gap-2 min-w-0">
                <Laptop size={16} className="text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{asset.name ?? asset.id}</span>
              </div>
            </td>
            <td className={`${BODY_CELL} text-xs truncate`}>{renderOwnerLabel(asset)}</td>
            <td className={`${BODY_CELL} text-right`}>
              <div className="flex items-center gap-2 justify-end">
                {!!asset.assetType && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {String(asset.assetType)}
                  </Badge>
                )}
                {outOfScope && (
                  <Badge variant="outline" className="text-xs text-muted-foreground whitespace-nowrap">
                    Out of scope
                  </Badge>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const PlatformAssetsTable: React.FC<PlatformAssetsTableProps> = ({ inScopeAssets, outOfScopeAssets }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const hasAssets = inScopeAssets.length > 0 || outOfScopeAssets.length > 0

  if (!hasAssets) {
    return (
      <div className="rounded-md border p-8 text-center">
        <Laptop size={32} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No assets linked to this platform.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {inScopeAssets.length > 0 && <AssetSection title="In Scope" assets={inScopeAssets} onRowClick={setSelectedAssetId} />}
        {outOfScopeAssets.length > 0 && <AssetSection title="Out of Scope" assets={outOfScopeAssets} outOfScope onRowClick={setSelectedAssetId} />}
      </div>

      <ViewAssetSheet entityId={selectedAssetId} onClose={() => setSelectedAssetId(null)} />
    </>
  )
}

export default PlatformAssetsTable
