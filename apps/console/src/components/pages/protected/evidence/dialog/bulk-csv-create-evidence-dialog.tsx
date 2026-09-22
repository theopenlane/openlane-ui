'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVEvidence } from '@/lib/graphql-hooks/evidence'

type BulkCSVCreateEvidenceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateEvidenceDialog: React.FC<BulkCSVCreateEvidenceDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkEvidence } = useCreateBulkCSVEvidence()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.EVIDENCE}
      displayName="Evidence"
      displayNamePlural="Evidence"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkEvidence({ input: file })
      }}
    />
  )
}

export { BulkCSVCreateEvidenceDialog }
