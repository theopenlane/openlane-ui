'use client'

import React from 'react'
import { useScan } from '@/lib/graphql-hooks/scan'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { objectType } from './table/types'
import useFormSchema from './hooks/use-form-schema'
import ScanDetailHeader from './detail/scan-detail-header'
import ScanDetailView from './detail/scan-detail-view'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewScanSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useScan(entityId || undefined)
  const scan = data?.scan

  return (
    <GenericDetailsSheet
      objectType={objectType}
      form={form}
      entityId={entityId}
      isCreateMode={false}
      data={scan}
      isFetching={isLoading}
      onClose={onClose}
      basePath="/exposure/scans"
      initialWidth="70vw"
      overrideHeader={<ScanDetailHeader data={scan} onClose={onClose} />}
      overrideContent={scan ? <ScanDetailView data={scan} /> : null}
    />
  )
}

export default ViewScanSheet
