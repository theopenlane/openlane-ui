'use client'

import React from 'react'
import { SectionCard } from '../components/section-card'
import { EmptyState } from '../components/empty-state'
import { LinkTargetCard } from '../components/link-target-card'
import type { LinkMap } from '../selection-utils'
import type { LinkableItem } from '../types'

type LinkStepProps = {
  platforms: LinkableItem[]
  systems: LinkableItem[]
  vendors: LinkableItem[]
  assets: LinkableItem[]
  defaultVendorIds: string[]
  defaultAssetIds: string[]
  vendorLinks: LinkMap
  setVendorLinks: React.Dispatch<React.SetStateAction<LinkMap>>
  assetLinks: LinkMap
  setAssetLinks: React.Dispatch<React.SetStateAction<LinkMap>>
  systemVendorLinks: LinkMap
  setSystemVendorLinks: React.Dispatch<React.SetStateAction<LinkMap>>
  systemAssetLinks: LinkMap
  setSystemAssetLinks: React.Dispatch<React.SetStateAction<LinkMap>>
}

export const LinkStep = ({
  platforms,
  systems,
  vendors,
  assets,
  defaultVendorIds,
  defaultAssetIds,
  vendorLinks,
  setVendorLinks,
  assetLinks,
  setAssetLinks,
  systemVendorLinks,
  setSystemVendorLinks,
  systemAssetLinks,
  setSystemAssetLinks,
}: LinkStepProps) => {
  if (platforms.length === 0) {
    return (
      <SectionCard title="Link vendors and assets" description="Select at least one platform to configure linking.">
        <EmptyState message="No platforms selected." />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Platforms</p>
        {platforms.map((platform) => (
          <LinkTargetCard
            key={platform.id}
            target={platform}
            kind="platform"
            vendors={vendors}
            assets={assets}
            defaultVendorIds={defaultVendorIds}
            defaultAssetIds={defaultAssetIds}
            vendorLinks={vendorLinks}
            setVendorLinks={setVendorLinks}
            assetLinks={assetLinks}
            setAssetLinks={setAssetLinks}
          />
        ))}
      </div>

      {systems.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">System Details - optionally narrow down which vendors and assets belong to each system</p>
          {systems.map((system) => (
            <LinkTargetCard
              key={system.id}
              target={system}
              kind="system"
              vendors={vendors}
              assets={assets}
              defaultVendorIds={[]}
              defaultAssetIds={[]}
              vendorLinks={systemVendorLinks}
              setVendorLinks={setSystemVendorLinks}
              assetLinks={systemAssetLinks}
              setAssetLinks={setSystemAssetLinks}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
