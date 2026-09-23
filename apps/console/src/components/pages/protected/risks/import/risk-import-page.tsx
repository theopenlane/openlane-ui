'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVRisk } from '@/lib/graphql-hooks/risk'

const RiskImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVRisk()

  return <RecordImportPage entityType={ObjectTypes.RISK} onImport={(input) => mutateAsync({ input })} />
}

export default RiskImportPage
