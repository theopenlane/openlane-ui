'use client'

import React, { cloneElement } from 'react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportDialog } from '@/components/shared/record-import/record-import-dialog'
import { useCreateBulkCSVControl } from '@/lib/graphql-hooks/control'
import { useControllableOpen } from '@/hooks/useControllableOpen'

type BulkCsvCreateControlDialogProps = {
  trigger?: React.ReactElement<Partial<{ onClick: React.MouseEventHandler }>>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const BulkCSVCreateControlDialog: React.FC<BulkCsvCreateControlDialogProps> = ({ trigger, open: openProp, onOpenChange }) => {
  const [isOpen, setIsOpen] = useControllableOpen({ open: openProp, onOpenChange })
  const { mutateAsync: createBulkControl } = useCreateBulkCSVControl()

  return (
    <>
      {/* eslint-disable-next-line @eslint-react/no-clone-element */}
      {trigger && cloneElement(trigger, { onClick: () => setIsOpen(true) })}
      <RecordImportDialog
        entityType={ObjectTypes.CONTROL}
        displayName="Control"
        open={isOpen}
        onOpenChange={setIsOpen}
        onImport={async (file) => {
          await createBulkControl({ input: file })
        }}
      />
    </>
  )
}

export { BulkCSVCreateControlDialog }
