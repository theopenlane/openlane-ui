import { useState } from 'react'
import { useAssetReadinessEvidence, useAssetReadinessReviews, useAssetReadinessScans, type useAssetVendors } from '@/lib/graphql-hooks/asset-detail'
import { getAssetOwner, type AssetDetailNode } from '../../../asset-display'
import { type TAssetExposure } from '../exposure/use-asset-exposure'
import { buildReadinessChecks } from './readiness-checks'

type TUseAssetReadinessArgs = {
  asset: AssetDetailNode
  exposure: TAssetExposure
  vendors: ReturnType<typeof useAssetVendors>
}

export const useAssetReadiness = ({ asset, exposure, vendors }: TUseAssetReadinessArgs) => {
  const [now] = useState(() => new Date())
  const reviews = useAssetReadinessReviews(asset.id)
  const scans = useAssetReadinessScans(asset.id)
  const evidence = useAssetReadinessEvidence(asset.id)
  const isExposureUnknown = !!exposure.error || exposure.isTruncated
  const isVendorsUnknown = vendors.isError || vendors.totalCount > vendors.vendors.length

  const checks = buildReadinessChecks({
    asset,
    ownerLabel: getAssetOwner(asset)?.displayName ?? null,
    exposure: { hasAccess: exposure.hasAnyAccess, isError: isExposureUnknown, data: isExposureUnknown ? undefined : exposure.items },
    vendors: { hasAccess: vendors.hasAccess, isError: isVendorsUnknown, data: isVendorsUnknown ? undefined : vendors.vendors },
    reviews,
    scans,
    evidence,
    now,
  })

  return { checks, isLoading: exposure.isPending || (vendors.hasAccess && vendors.isPending) || reviews.isLoading || scans.isLoading || evidence.isLoading }
}
