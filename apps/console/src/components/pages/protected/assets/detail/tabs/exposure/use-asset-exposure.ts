import { useMemo } from 'react'
import { useSlaDaysByLevel } from '@/hooks/useSla'
import { ASSET_EXPOSURE_LIMIT, type TAssetExposureFilters, useAssetExposureSources } from '@/lib/graphql-hooks/asset-detail'
import { buildExposureItems } from './exposure-items'

export const useAssetExposure = (assetId: string, filters?: TAssetExposureFilters) => {
  const { vulnerabilities, findings, risks, ...state } = useAssetExposureSources(assetId, filters)
  const slaDaysByLevel = useSlaDaysByLevel()
  const items = useMemo(
    () => buildExposureItems({ vulnerabilities: vulnerabilities?.nodes, findings: findings?.nodes, risks: risks?.nodes }, slaDaysByLevel),
    [vulnerabilities, findings, risks, slaDaysByLevel],
  )
  const totalCount = [vulnerabilities, findings, risks].reduce((total, source) => total + (source?.totalCount ?? 0), 0)
  const isTruncated = [vulnerabilities, findings, risks].some((source) => (source?.totalCount ?? 0) > ASSET_EXPOSURE_LIMIT)

  return { ...state, items, totalCount, isTruncated }
}

export type TAssetExposure = ReturnType<typeof useAssetExposure>
