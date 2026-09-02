'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { CreateControlImplementationForm } from './form/create-control-implementation-form'
import { ControlImplementationDocumentStatus, type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import useFormSchema from './form/use-form-schema'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import { useDeleteControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { SheetFormHeader } from '@/components/shared/crud-base/sheet-form-header'
import { SlideoutFormFooter } from '@/components/shared/crud-base/slideout-footer'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useNotification } from '@/hooks/useNotification'

type CreateControlImplementationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlImplementationFieldsFragment | null
}

const CreateControlImplementationSheet: React.FC<CreateControlImplementationSheetProps> = ({ open, onOpenChange, editData }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const formId = useId()
  const { form } = useFormSchema()
  const { isDirty, isSubmitting } = form.formState
  const { successNotification } = useNotification()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()

  const openedWith = useRetainedWhileOpen(open, editData)

  const normalizedValues = useMemo(() => {
    return openedWith
      ? {
          id: openedWith.id,
          details: openedWith.details ?? '',
          status: openedWith.status ?? ControlImplementationDocumentStatus.DRAFT,
          implementationDate: openedWith.implementationDate ? new Date(openedWith.implementationDate) : undefined,
        }
      : undefined
  }, [openedWith])

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
    if (isDirty) {
      setShowCancelDialog(true)
      return
    }
    onOpenChange(false)
  }

  const handleConfirmClose = () => {
    setShowCancelDialog(false)
    onOpenChange(false)
  }

  const handleDelete = async (implementationId: string) => {
    await deleteImplementation({ deleteControlImplementationId: implementationId })
    successNotification({ title: 'Control Implementation deleted' })
    onOpenChange(false)
  }

  const isEditing = !!editData

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
            if (isDirty) {
              e.preventDefault()
              setShowCancelDialog(true)
            }
          }}
          header={
            <SheetFormHeader
              mode={isEditing ? 'edit' : 'create'}
              entityType={ObjectTypes.CONTROL_IMPLEMENTATION}
              close={handleClose}
              remove={editData ? { entityId: editData.id, onDelete: handleDelete } : undefined}
            />
          }
          footer={
            <SlideoutFormFooter formId={formId} onCancel={handleClose} isPending={isSubmitting} saveLabel={isEditing ? 'Save' : 'Create'} savingLabel={isEditing ? 'Saving...' : 'Creating...'} />
          }
        >
          <CreateControlImplementationForm formId={formId} form={form} onSuccess={() => onOpenChange(false)} defaultValues={normalizedValues} />
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export default CreateControlImplementationSheet
