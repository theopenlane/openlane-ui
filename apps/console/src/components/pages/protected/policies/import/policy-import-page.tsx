'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVInternalPolicy } from '@/lib/graphql-hooks/internal-policy'

const PolicyImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVInternalPolicy()

  return <RecordImportPage entityType={ObjectTypes.INTERNAL_POLICY} onImport={(input) => mutateAsync({ input })} />
}

export default PolicyImportPage
