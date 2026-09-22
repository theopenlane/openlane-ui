'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVMappedControl } from '@/lib/graphql-hooks/control'

type BulkCsvCreateMappedControlDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateMappedControlDialog: React.FC<BulkCsvCreateMappedControlDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkMappedControl } = useCreateBulkCSVMappedControl()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.MAPPED_CONTROL}
      displayName="Control mapping"
      displayNamePlural="Control mappings"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkMappedControl({ input: file })
      }}
    />
  )
}

export { BulkCSVCreateMappedControlDialog }
