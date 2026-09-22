'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVTask } from '@/lib/graphql-hooks/task'

type BulkCsvCreateTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateTaskDialog: React.FC<BulkCsvCreateTaskDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkTask } = useCreateBulkCSVTask()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.TASK}
      displayName="Task"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkTask({ input: file })
      }}
    />
  )
}

export { BulkCSVCreateTaskDialog }
