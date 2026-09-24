'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVMappedControl } from '@/lib/graphql-hooks/control'

const MappedControlImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVMappedControl()

  return <RecordImportPage entityType={ObjectTypes.MAPPED_CONTROL} onImport={(input) => mutateAsync({ input })} />
}

export default MappedControlImportPage
