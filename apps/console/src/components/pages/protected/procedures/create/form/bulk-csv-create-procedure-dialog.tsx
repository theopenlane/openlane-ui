'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVProcedure } from '@/lib/graphql-hooks/procedure'

type TBulkCSVCreateProcedureDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateProcedureDialog: React.FC<TBulkCSVCreateProcedureDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkProcedure } = useCreateBulkCSVProcedure()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.PROCEDURE}
      displayName="Procedure"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkProcedure({ input: file })
      }}
    />
  )
}

export default BulkCSVCreateProcedureDialog
