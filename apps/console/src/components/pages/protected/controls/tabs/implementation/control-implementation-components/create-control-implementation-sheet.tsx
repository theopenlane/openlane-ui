'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { CreateControlImplementationForm } from './form/create-control-implementation-form'
import { ControlImplementationDocumentStatus, type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import useFormSchema, { type TFormData } from './form/use-form-schema'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import { useDeleteControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { SheetFormHeader } from '@/components/shared/crud-base/sheet-form-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useNotification } from '@/hooks/useNotification'

type CreateControlImplementationSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlImplementationFieldsFragment | null
  createDefaults?: Partial<TFormData>
  showControlPicker?: boolean
  onCreated?: (id: string) => void
}

const CreateControlImplementationSheet: React.FC<CreateControlImplementationSheetProps> = ({ open, onOpenChange, editData, createDefaults, showControlPicker, onCreated }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const formId = useId()
  const { form } = useFormSchema()
  const { isDirty, isSubmitting } = form.formState
  const { successNotification } = useNotification()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()

  const openedWith = useRetainedWhileOpen(open, editData)
  const createdWith = useRetainedWhileOpen(open, createDefaults)

  const normalizedValues = useMemo(() => {
    return openedWith
      ? {
          id: openedWith.id,
          details: openedWith.details ?? '',
          status: openedWith.status ?? ControlImplementationDocumentStatus.DRAFT,
          implementationDate: openedWith.implementationDate ? new Date(openedWith.implementationDate) : null,
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
        ...createdWith,
      })
    }
  }, [open, form, normalizedValues, createdWith])

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

  const handleSuccess = (createdId?: string) => {
    onOpenChange(false)
    if (createdId) onCreated?.(createdId)
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
              formActions={
                <SlideoutFormActions formId={formId} onCancel={handleClose} isPending={isSubmitting} saveLabel={isEditing ? 'Save' : 'Create'} savingLabel={isEditing ? 'Saving...' : 'Creating...'} />
              }
            />
          }
        >
          <CreateControlImplementationForm
            formId={formId}
            form={form}
            onSuccess={handleSuccess}
            defaultValues={normalizedValues}
            createDefaults={createdWith ?? undefined}
            showControlPicker={showControlPicker}
          />
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export default CreateControlImplementationSheet
