'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useFormSchema from '@/components/pages/protected/scans/hooks/use-form-schema'
import { useScan } from '@/lib/graphql-hooks/scan'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { objectType } from '@/components/pages/protected/scans/table/types'
import ScanDetailHeader from '@/components/pages/protected/scans/detail/scan-detail-header'
import ScanDetailView from '@/components/pages/protected/scans/detail/scan-detail-view'

type ScanDetailsSheetProps = {
  queryParamKey: string
}

const ScanDetailsSheet: React.FC<ScanDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const { form } = useFormSchema()
  const { data, isLoading } = useScan(entityId || undefined)
  const scan = data?.scan

  const handleClose = () => {
    form.reset()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  return (
    <GenericDetailsSheet
      objectType={objectType}
      form={form}
      entityId={entityId}
      isCreateMode={false}
      data={scan}
      isFetching={isLoading}
      onClose={handleClose}
      initialWidth="70vw"
      overrideHeader={<ScanDetailHeader data={scan} onClose={handleClose} />}
      overrideContent={scan ? <ScanDetailView data={scan} /> : null}
    />
  )
}

export default ScanDetailsSheet
