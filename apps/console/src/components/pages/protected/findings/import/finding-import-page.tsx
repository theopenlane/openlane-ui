'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVFinding } from '@/lib/graphql-hooks/finding'

const FindingImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVFinding()

  return <RecordImportPage entityType={ObjectTypes.FINDING} onImport={(input) => mutateAsync({ input })} />
}

export default FindingImportPage
