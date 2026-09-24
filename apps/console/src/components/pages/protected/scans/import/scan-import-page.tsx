'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVScan } from '@/lib/graphql-hooks/scan'

const ScanImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVScan()

  return <RecordImportPage entityType={ObjectTypes.SCAN} onImport={(input) => mutateAsync({ input })} />
}

export default ScanImportPage
