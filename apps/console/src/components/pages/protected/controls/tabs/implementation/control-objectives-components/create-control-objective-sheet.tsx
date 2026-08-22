'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useEffect, useId, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CreateControlObjectiveForm } from './form/create-control-objective-form'
import { useSuggestedObjective } from '@/components/pages/protected/controls/suggested-objective'
import { ControlObjectiveControlSource, type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import useFormSchema from './form/use-form-schema'
import { VersionBump } from '@/lib/enums/revision-enum'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useRetainedWhileOpen } from '@/hooks/useRetainedWhileOpen'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { useDeleteControlObjective } from '@/lib/graphql-hooks/control-objective'
import { SheetFormHeader } from '@/components/shared/crud-base/sheet-form-header'
import { SlideoutFormFooter } from '@/components/shared/crud-base/slideout-footer'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useNotification } from '@/hooks/useNotification'

type CreateControlObjectiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlObjectiveFieldsFragment | null
}

const CreateControlObjectiveSheet: React.FC<CreateControlObjectiveSheetProps> = ({ open, onOpenChange, editData }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const formId = useId()
  const { form } = useFormSchema()
  const { isDirty, isSubmitting } = form.formState
  const { successNotification } = useNotification()
  const { mutateAsync: deleteObjective } = useDeleteControlObjective()
  const { id, subcontrolId } = useParams<{ id?: string; subcontrolId?: string }>()
  const isSubcontrol = !!subcontrolId
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(isSubcontrol ? null : (id ?? null))
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(subcontrolId ?? null)

  const openedWith = useRetainedWhileOpen(open, editData)

  // the docs suggestion belongs here too, where the objective is actually written
  const objectiveControl = controlData?.control
  const objectiveSuggestionData = useSuggestedObjective(
    !isSubcontrol && objectiveControl
      ? { controlId: objectiveControl.id, refCode: objectiveControl.refCode, referenceFramework: objectiveControl.referenceFramework, source: objectiveControl.source }
      : undefined,
    open && !openedWith,
  )
  const suggestion = !openedWith && objectiveSuggestionData && !objectiveSuggestionData.dismissed ? objectiveSuggestionData.suggestion : null
  const loading = isLoadingControl || isLoadingSubcontrol

  const normalizedValues = useMemo(() => {
    if (!openedWith) return undefined
    const RevisionBump: VersionBump | undefined = openedWith.status === ControlObjectiveObjectiveStatus.DRAFT ? VersionBump.DRAFT : undefined
    return {
      id: openedWith.id,
      name: openedWith.name ?? '',
      desiredOutcome: openedWith.desiredOutcome ?? '',
      status: openedWith.status ?? ControlObjectiveObjectiveStatus.DRAFT,
      source: openedWith.source ?? ControlObjectiveControlSource.USER_DEFINED,
      controlObjectiveType: openedWith.controlObjectiveType ?? '',
      category: openedWith.category ?? '',
      subcategory: openedWith.subcategory ?? '',
      revision: openedWith.revision ?? '',
      RevisionBump,
    }
  }, [openedWith])

  useEffect(() => {
    if (!open) return
    if (normalizedValues) {
      form.reset(normalizedValues)
      return
    }
    if (loading) return
    form.reset({
      status: ControlObjectiveObjectiveStatus.DRAFT,
      source: ControlObjectiveControlSource.USER_DEFINED,
      category: subcontrolData?.subcontrol?.category || controlData?.control?.category || '',
      subcategory: subcontrolData?.subcontrol?.subcategory || controlData?.control?.subcategory || '',
      name: suggestion?.name ?? '',
      desiredOutcome: suggestion?.desiredOutcome ?? '',
    })
  }, [open, form, normalizedValues, loading, controlData, subcontrolData, suggestion])

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

  const handleDelete = async (objectiveId: string) => {
    await deleteObjective({ deleteControlObjectiveId: objectiveId })
    successNotification({ title: 'Control Objective deleted' })
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
              entityType={ObjectTypes.CONTROL_OBJECTIVE}
              close={handleClose}
              remove={editData ? { entityId: editData.id, onDelete: handleDelete } : undefined}
            />
          }
          footer={
            <SlideoutFormFooter formId={formId} onCancel={handleClose} isPending={isSubmitting} saveLabel={isEditing ? 'Save' : 'Create'} savingLabel={isEditing ? 'Saving...' : 'Creating...'} />
          }
        >
          <CreateControlObjectiveForm
            formId={formId}
            form={form}
            onSuccess={() => onOpenChange(false)}
            defaultValues={normalizedValues}
            suggestedValues={suggestion ? { name: suggestion.name, desiredOutcome: suggestion.desiredOutcome } : undefined}
          />
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}

export default CreateControlObjectiveSheet
