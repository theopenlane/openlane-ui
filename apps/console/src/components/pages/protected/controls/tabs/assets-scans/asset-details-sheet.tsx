'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ViewAssetSheet from '@/components/pages/protected/assets/view-asset-sheet'

type AssetDetailsSheetProps = {
  queryParamKey: string
}

const AssetDetailsSheet: React.FC<AssetDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  return <ViewAssetSheet entityId={searchParams.get(queryParamKey)} onClose={handleClose} />
}

export default AssetDetailsSheet
