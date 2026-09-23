'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVRemediation } from '@/lib/graphql-hooks/remediation'

const RemediationImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVRemediation()

  return <RecordImportPage entityType={ObjectTypes.REMEDIATION} onImport={(input) => mutateAsync({ input })} />
}

export default RemediationImportPage
