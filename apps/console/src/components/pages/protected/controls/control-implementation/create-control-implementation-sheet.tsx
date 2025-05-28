'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React from 'react'
import { ControlObjectiveFieldsFragment } from '@repo/codegen/src/schema'
import { CreateControlImplementationForm } from './form/create-control-implementation-form'

type CreateControlImplementationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlObjectiveFieldsFragment | null
}

const CreateControlImplementationSheet: React.FC<CreateControlImplementationSheetProps> = ({ open, onOpenChange, editData }) => {
  const normalizedValues = undefined

  // const normalizedValues = editData
  //   ? {
  //       id: editData.id,
  //       name: editData.name ?? '',
  //       desiredOutcome: editData.desiredOutcome ?? '',
  //       status: editData.status ?? ControlObjectiveObjectiveStatus.DRAFT,
  //       source: editData.source ?? ControlObjectiveControlSource.USER_DEFINED,
  //       controlObjectiveType: editData.controlObjectiveType ?? '',
  //       category: editData.category ?? '',
  //       subcategory: editData.subcategory ?? '',
  //       revision: editData.revision ?? '',
  //       RevisionBump,
  //     }
  //   : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <CreateControlImplementationForm onSuccess={() => onOpenChange(false)} defaultValues={normalizedValues} />
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlImplementationSheet
