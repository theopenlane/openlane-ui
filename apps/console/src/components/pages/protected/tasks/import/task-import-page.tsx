'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage } from '@/components/shared/record-import/record-import-page'
import { useCreateBulkCSVTask } from '@/lib/graphql-hooks/task'

const TaskImportPage: React.FC = () => {
  const { mutateAsync } = useCreateBulkCSVTask()

  return <RecordImportPage entityType={ObjectTypes.TASK} onImport={(input) => mutateAsync({ input })} />
}

export default TaskImportPage
