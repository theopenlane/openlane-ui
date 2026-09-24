'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVProcedure } from '@/lib/graphql-hooks/procedure'

const ProcedureImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVProcedure()

  return <RecordImportPage entityType={ObjectTypes.PROCEDURE} onImport={(input) => mutateAsync({ input })} />
}

export default ProcedureImportPage
