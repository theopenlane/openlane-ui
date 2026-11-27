import React from 'react'
import { type Metadata } from 'next'
import AssetDetailPage from '@/components/pages/protected/assets/detail/asset-detail-page'

export const metadata: Metadata = {
  title: 'Asset Details',
}

const AssetDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <AssetDetailPage key={id} assetId={id} />
}

export default AssetDetailsPage
