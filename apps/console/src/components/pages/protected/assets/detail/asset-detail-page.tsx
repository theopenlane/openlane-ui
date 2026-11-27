'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useAsset } from '@/lib/graphql-hooks/asset'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { ObjectWithDetailsSkeleton } from '@/components/shared/skeleton/object-with-slideout-skeleton'
import { ASSETS_HREF, getAssetTitle } from '../asset-display'
import { breadcrumbs as ASSET_BREADCRUMBS } from '../table/table-config'

import { isNonRetryableGraphQlError } from '@/utils/graphQlErrorMatcher'
import AssetDetail from './asset-detail'

const AssetDetailPage: React.FC<{ assetId: string }> = ({ assetId }) => {
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { data, isPending, error, refetch } = useAsset(assetId)
  const asset = data?.asset
  const title = asset ? getAssetTitle(asset) : ''
  useQueryErrorNotification({ error: asset ? error : null, description: 'Failed to refresh asset' })

  useEffect(() => {
    setCrumbs([...ASSET_BREADCRUMBS, { label: title, isLoading: isPending }])
  }, [setCrumbs, title, isPending])

  if (isPending) return <ObjectWithDetailsSkeleton />

  if (!asset) {
    const isLoadFailure = !!error && !isNonRetryableGraphQlError(error)
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>{isLoadFailure ? 'The asset could not be loaded.' : 'Asset not found.'}</p>
        {isLoadFailure && (
          <Button variant="secondary" className="mt-4 mr-2" onClick={() => refetch()}>
            Retry
          </Button>
        )}
        <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(ASSETS_HREF)}>
          Back to Assets
        </Button>
      </div>
    )
  }

  return <AssetDetail asset={asset} title={title} />
}

export default AssetDetailPage
