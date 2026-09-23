'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVGroup } from '@/lib/graphql-hooks/group'

const GroupImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVGroup()

  return <RecordImportPage entityType={ObjectTypes.GROUP} onImport={(input) => mutateAsync({ input })} />
}

export default GroupImportPage
