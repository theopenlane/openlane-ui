'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVInternalPolicy } from '@/lib/graphql-hooks/internal-policy'

type TBulkCSVCreatePolicyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreatePolicyDialog: React.FC<TBulkCSVCreatePolicyDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkInternalPolicy } = useCreateBulkCSVInternalPolicy()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.INTERNAL_POLICY}
      displayName="Policy"
      displayNamePlural="Policies"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkInternalPolicy({ input: file })
      }}
    />
  )
}

export default BulkCSVCreatePolicyDialog
