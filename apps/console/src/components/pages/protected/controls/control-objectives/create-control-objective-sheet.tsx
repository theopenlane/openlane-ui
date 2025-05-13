'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React from 'react'
import { CreateControlObjectiveForm } from './create-control-objective-form'

type CreateControlObjectiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CreateControlObjectiveSheet: React.FC<CreateControlObjectiveSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto">
        <CreateControlObjectiveForm onSuccess={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

export default CreateControlObjectiveSheet
