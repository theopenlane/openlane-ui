'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVControl } from '@/lib/graphql-hooks/control'

const ControlImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVControl()

  return <RecordImportPage entityType={ObjectTypes.CONTROL} onImport={(input) => mutateAsync({ input })} />
}

export default ControlImportPage
