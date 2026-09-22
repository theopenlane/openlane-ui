'use client'

import React from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVSubscriber } from '@/lib/graphql-hooks/subscriber'

type BulkCsvCreateSubscriberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BulkCSVCreateSubscriberDialog: React.FC<BulkCsvCreateSubscriberDialogProps> = ({ open, onOpenChange }) => {
  const { mutateAsync: createBulkSubscriber } = useCreateBulkCSVSubscriber()

  return (
    <RecordImportDialog
      entityType={ObjectTypes.SUBSCRIBER}
      displayName="Subscriber"
      open={open}
      onOpenChange={onOpenChange}
      onImport={async (file) => {
        await createBulkSubscriber({ input: file })
      }}
    />
  )
}

export default BulkCSVCreateSubscriberDialog
