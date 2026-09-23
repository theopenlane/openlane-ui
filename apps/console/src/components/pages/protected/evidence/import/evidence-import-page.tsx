'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVEvidence } from '@/lib/graphql-hooks/evidence'

const EvidenceImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVEvidence()

  return <RecordImportPage entityType={ObjectTypes.EVIDENCE} onImport={(input) => mutateAsync({ input })} />
}

export default EvidenceImportPage
