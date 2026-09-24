'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVSystemDetail } from '@/lib/graphql-hooks/system-detail'

const SystemDetailImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVSystemDetail()

  return <RecordImportPage entityType={ObjectTypes.SYSTEM_DETAIL} onImport={(input) => mutateAsync({ input })} />
}

export default SystemDetailImportPage
