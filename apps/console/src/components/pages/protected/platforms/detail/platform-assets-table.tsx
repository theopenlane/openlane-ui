'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Laptop } from 'lucide-react'
import ViewAssetSheet from '@/components/pages/protected/assets/view-asset-sheet'

type AssetNode = {
  id: string
  name?: string | null
  assetType?: unknown
}

interface PlatformAssetsTableProps {
  platformId: string
  inScopeAssets: AssetNode[]
  outOfScopeAssets: AssetNode[]
  canEdit: boolean
}

const AssetRow: React.FC<{ asset: AssetNode; outOfScope?: boolean; onClick: () => void }> = ({ asset, outOfScope, onClick }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${outOfScope ? 'opacity-60' : ''}`} onClick={onClick}>
    <Laptop size={16} className="text-muted-foreground shrink-0" />
    <span className="text-sm font-medium flex-1">{asset.name ?? asset.id}</span>
    {!!asset.assetType && (
      <Badge variant="outline" className="text-xs">
        {String(asset.assetType)}
      </Badge>
    )}
    {outOfScope && (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Out of scope
      </Badge>
    )}
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
        {inScopeAssets.length > 0 && (
          <div className="rounded-md border">
            <div className="px-4 py-2 bg-muted/30 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In Scope ({inScopeAssets.length})</span>
            </div>
            {inScopeAssets.map((asset) => (
              <AssetRow key={asset.id} asset={asset} onClick={() => setSelectedAssetId(asset.id)} />
            ))}
          </div>
        )}
        {outOfScopeAssets.length > 0 && (
          <div className="rounded-md border">
            <div className="px-4 py-2 bg-muted/30 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Out of Scope ({outOfScopeAssets.length})</span>
            </div>
            {outOfScopeAssets.map((asset) => (
              <AssetRow key={asset.id} asset={asset} outOfScope onClick={() => setSelectedAssetId(asset.id)} />
            ))}
          </div>
        )}
      </div>

      <ViewAssetSheet entityId={selectedAssetId} onClose={() => setSelectedAssetId(null)} />
    </>
  )
}

export default PlatformAssetsTable
