'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React from 'react'
import { CreateControlImplementationForm } from './form/create-control-implementation-form'
import { ControlImplementationDocumentStatus, ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'

type CreateControlImplementationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlImplementationFieldsFragment | null
}

const CreateControlImplementationSheet: React.FC<CreateControlImplementationSheetProps> = ({ open, onOpenChange, editData }) => {
  const normalizedValues = editData
    ? {
        id: editData.id,
        details: editData.details ?? '',
        status: editData?.status as ControlImplementationDocumentStatus,
        implementationDate: new Date(editData?.implementationDate),
        verified: editData.verified ?? false,
      }
    : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <CreateControlImplementationForm onSuccess={() => onOpenChange(false)} defaultValues={normalizedValues} />
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlImplementationSheet
