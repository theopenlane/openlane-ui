'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useState } from 'react'
import { CreateControlObjectiveForm } from './form/create-control-objective-form'
import { ControlObjectiveControlSource, type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import useFormSchema from './form/use-form-schema'
import { VersionBump } from '@/lib/enums/revision-enum'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'

type CreateControlObjectiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlObjectiveFieldsFragment | null
}

const CreateControlObjectiveSheet: React.FC<CreateControlObjectiveSheetProps> = ({ open, onOpenChange, editData }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { form } = useFormSchema()

  const RevisionBump: VersionBump | undefined = editData?.status === ControlObjectiveObjectiveStatus.DRAFT ? VersionBump.DRAFT : undefined
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
        revision: editData.revision ?? '',
        RevisionBump,
      }
    : undefined

  const handleClose = () => {
    if (form.formState.isDirty) {
      setShowCancelDialog(true)
      return
    }
    onOpenChange(false)
  }

  const handleConfirmClose = () => {
    setShowCancelDialog(false)
    form.reset()
    onOpenChange(false)
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose()
          } else {
            onOpenChange(true)
          }
        }}
      >
        <SheetContent
          className="flex flex-col"
          onEscapeKeyDown={(e) => {
            if (form.formState.isDirty) {
              e.preventDefault()
              setShowCancelDialog(true)
            }
          }}
        >
          <CreateControlObjectiveForm form={form} onSuccess={() => onOpenChange(false)} onClose={handleClose} defaultValues={normalizedValues} />
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export default CreateControlObjectiveSheet
