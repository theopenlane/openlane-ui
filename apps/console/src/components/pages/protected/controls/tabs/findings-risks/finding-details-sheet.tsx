'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ViewFindingSheet from '@/components/pages/protected/findings/view-finding-sheet'

type FindingDetailsSheetProps = {
  queryParamKey: string
}

const FindingDetailsSheet: React.FC<FindingDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  return <ViewFindingSheet entityId={entityId} onClose={handleClose} />
}

export default FindingDetailsSheet
