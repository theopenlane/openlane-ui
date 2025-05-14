'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React from 'react'
import { CreateControlObjectiveForm } from './create-control-objective-form'
import { ControlObjectiveControlSource, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'

type CreateControlObjectiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlObjectiveFieldsFragment | null
}

const CreateControlObjectiveSheet: React.FC<CreateControlObjectiveSheetProps> = ({ open, onOpenChange, editData }) => {
  const normalizedValues = editData
    ? {
        id: editData.id,
        name: editData.name ?? '',
        desiredOutcome: editData.desiredOutcome ?? '',
        status: editData.status ?? ControlObjectiveObjectiveStatus.DRAFT,
        source: editData.source ?? ControlObjectiveControlSource.USER_DEFINED,
        controlObjectiveType: editData.controlObjectiveType ?? '',
        category: editData.category ?? '',
        subcategory: editData.subcategory ?? '',
      }
    : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <CreateControlObjectiveForm onSuccess={() => onOpenChange(false)} defaultValues={normalizedValues} />
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlObjectiveSheet
