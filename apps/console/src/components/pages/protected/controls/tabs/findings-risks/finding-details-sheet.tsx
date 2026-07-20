'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { useFindingSheetConfig } from '@/components/pages/protected/findings/hooks/use-finding-sheet-config'

type FindingDetailsSheetProps = {
  queryParamKey: string
}

const FindingDetailsSheet: React.FC<FindingDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const sheetConfig = useFindingSheetConfig(entityId)

  const handleClose = () => {
    sheetConfig.form.reset()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  return <GenericDetailsSheet onClose={handleClose} {...sheetConfig} />
}

export default FindingDetailsSheet
