'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVRisk } from '@/lib/graphql-hooks/risk'

type BulkCsvCreateRiskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateRiskDialog: React.FC<BulkCsvCreateRiskDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkRisk } = useCreateBulkCSVRisk()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.RISK}
      displayName="Risk"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkRisk({ input: file })
      }}
    />
  )
}

export default BulkCSVCreateRiskDialog
