'use client'

import { Sheet, SheetContent } from '@repo/ui/sheet'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CreateControlObjectiveForm } from './form/create-control-objective-form'
import { ControlObjectiveControlSource, type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import useFormSchema from './form/use-form-schema'
import { VersionBump } from '@/lib/enums/revision-enum'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'

type CreateControlObjectiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: ControlObjectiveFieldsFragment | null
}

const CreateControlObjectiveSheet: React.FC<CreateControlObjectiveSheetProps> = ({ open, onOpenChange, editData }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { form } = useFormSchema()
  const { id, subcontrolId } = useParams<{ id?: string; subcontrolId?: string }>()
  const isSubcontrol = !!subcontrolId
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(isSubcontrol ? null : (id ?? null))
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(subcontrolId ?? null)
  const loading = isLoadingControl || isLoadingSubcontrol

  const normalizedValues = useMemo(() => {
    if (!editData) return undefined
    const RevisionBump: VersionBump | undefined = editData.status === ControlObjectiveObjectiveStatus.DRAFT ? VersionBump.DRAFT : undefined
    return {
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
  }, [editData])

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
    })
  }, [open, form, normalizedValues, loading, controlData, subcontrolData])

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
