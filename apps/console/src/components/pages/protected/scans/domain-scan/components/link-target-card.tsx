'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { Separator } from '@repo/ui/separator'
import { SectionCard } from './section-card'
import { VendorLogo } from './vendor-logo'
import { LinkSelectAllToggle } from './link-select-all-toggle'
import { getLinkedIds, toggleLinkValue, type LinkMap } from '../selection-utils'
import type { LinkableItem } from '../types'

type LinkTargetCardProps = {
  target: { id: string; name: string }
  kind: 'platform' | 'system'
  vendors: LinkableItem[]
  assets: LinkableItem[]
  defaultVendorIds: string[]
  defaultAssetIds: string[]
  vendorLinks: LinkMap
  setVendorLinks: React.Dispatch<React.SetStateAction<LinkMap>>
  assetLinks: LinkMap
  setAssetLinks: React.Dispatch<React.SetStateAction<LinkMap>>
}

export const LinkTargetCard = ({ target, kind, vendors, assets, defaultVendorIds, defaultAssetIds, vendorLinks, setVendorLinks, assetLinks, setAssetLinks }: LinkTargetCardProps) => {
  const vendorIds = vendors.map((vendor) => vendor.id)
  const assetIds = assets.map((asset) => asset.id)
  const linkedVendorIds = getLinkedIds(vendorLinks, target.id, defaultVendorIds)
  const linkedAssetIds = getLinkedIds(assetLinks, target.id, defaultAssetIds)

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <Badge variant={kind === 'platform' ? 'primary' : 'outline'}>{kind === 'platform' ? 'Platform' : 'System'}</Badge>
          {target.name}
        </span>
      }
      description={
        kind === 'platform'
          ? 'Everything you selected for import is linked by default, uncheck anything that does not belong here.'
          : 'Nothing is linked by default, check the vendors and assets that belong here.'
      }
      collapsible
      className={kind === 'platform' ? 'border-l-4 border-l-brand' : 'border-l-4 border-l-border'}
    >
      {vendors.length > 0 ? (
        <div className="px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Vendors ({linkedVendorIds.size} of {vendors.length} linked)
            </p>
            <LinkSelectAllToggle targetId={target.id} ids={vendorIds} links={vendorLinks} setLinks={setVendorLinks} defaultIds={defaultVendorIds} />
          </div>
          <div className="flex flex-wrap gap-2">
            {vendors.map((vendor) => (
              <label key={vendor.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
                <Checkbox checked={linkedVendorIds.has(vendor.id)} onCheckedChange={() => toggleLinkValue(setVendorLinks, target.id, vendor.id, defaultVendorIds)} />
                <VendorLogo name={vendor.name} logoUrl={vendor.logoUrl} />
                {vendor.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      {vendors.length > 0 && assets.length > 0 ? <Separator separatorClass="bg-border" /> : null}
      {assets.length > 0 ? (
        <div className="px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Assets ({linkedAssetIds.size} of {assets.length} linked)
            </p>
            <LinkSelectAllToggle targetId={target.id} ids={assetIds} links={assetLinks} setLinks={setAssetLinks} defaultIds={defaultAssetIds} />
          </div>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => (
              <label key={asset.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
                <Checkbox checked={linkedAssetIds.has(asset.id)} onCheckedChange={() => toggleLinkValue(setAssetLinks, target.id, asset.id, defaultAssetIds)} />
                {asset.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}
