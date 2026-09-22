'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVTemplate } from '@/lib/graphql-hooks/template'

type BulkCsvCreateTemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateTemplateDialog: React.FC<BulkCsvCreateTemplateDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkTemplate } = useCreateBulkCSVTemplate()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.TEMPLATE}
      displayName="Template"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkTemplate({ input: file })
      }}
    />
  )
}

export { BulkCSVCreateTemplateDialog }
