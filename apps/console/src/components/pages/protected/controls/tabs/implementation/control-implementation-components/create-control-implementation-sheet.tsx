'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useEffect, useMemo, useState } from 'react'
import { CreateControlImplementationForm } from './form/create-control-implementation-form'
import { ControlImplementationDocumentStatus, type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import useFormSchema from './form/use-form-schema'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'

type CreateControlImplementationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlImplementationFieldsFragment | null
}

const CreateControlImplementationSheet: React.FC<CreateControlImplementationSheetProps> = ({ open, onOpenChange, editData }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { form } = useFormSchema()

  const normalizedValues = useMemo(() => {
    return editData
      ? {
          id: editData.id,
          details: editData.details ?? '',
          status: editData.status ?? ControlImplementationDocumentStatus.DRAFT,
          implementationDate: editData.implementationDate ? new Date(editData.implementationDate) : undefined,
        }
      : undefined
  }, [editData])

  useEffect(() => {
    if (!open) return
    if (normalizedValues) {
      form.reset(normalizedValues)
    } else {
      form.reset({
        implementationDate: new Date(),
        status: ControlImplementationDocumentStatus.DRAFT,
      })
    }
  }, [open, form, normalizedValues])

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
          <CreateControlImplementationForm form={form} onSuccess={() => onOpenChange(false)} onClose={handleClose} defaultValues={normalizedValues} />
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export default CreateControlImplementationSheet
