'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVAsset } from '@/lib/graphql-hooks/asset'

const AssetImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVAsset()

  return <RecordImportPage entityType={ObjectTypes.ASSET} onImport={(input) => mutateAsync({ input })} />
}

export default AssetImportPage
