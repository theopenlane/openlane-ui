'use client'

import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { LinkIcon, PanelRightClose, Pencil } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { GenericDeleteDialog } from './dialog/delete-dialog'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

interface GenericSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isCreate: boolean
  isPending: boolean
  isEditAllowed: boolean
  handleCancelEdit: () => void
  formId: string
  entityType: ObjectTypes
  onDelete?: (id: string) => Promise<void>
  entityId?: string | null
  basePath?: string
}

export const GenericSheetHeader = ({
  close,
  isEditing,
  isCreate,
  setIsEditing,
  isPending,
  isEditAllowed,
  handleCancelEdit,
  formId,
  entityType,
  onDelete,
  entityId,
  basePath,
}: GenericSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const id = entityId ?? searchParams.get('id')

  const handleCopyLink = () => {
    if (!id) {
      return
    }

    const path = basePath ?? window.location.pathname
    const url = `${window.location.origin}${path}?id=${id}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  return (
    <SheetHeader>
      <SheetTitle className="sr-only">{isCreate ? `Create ${toHumanLabel(entityType)}` : toHumanLabel(entityType)}</SheetTitle>
      <div className="flex items-center justify-between">
        {!isCreate ? <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={close} /> : <div className="h-6 text-lg">Create {toHumanLabel(entityType)}</div>}
        <div className="flex justify-end gap-2 mr-6">
          {!isCreate && (
            <Button icon={<LinkIcon />} iconPosition="left" variant="secondary" onClick={handleCopyLink}>
              Copy link
            </Button>
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <CancelButton disabled={isPending} onClick={handleCancelEdit}></CancelButton>
              {isCreate ? (
                <SaveButton form={formId} disabled={isPending} isSaving={isPending} title="Create" savingTitle="Creating..." />
              ) : (
                <SaveButton form={formId} disabled={isPending} isSaving={isPending} />
              )}
            </div>
          ) : (
            <>
              {isEditAllowed && (
                <Button icon={<Pencil />} iconPosition="left" variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {onDelete && entityType && id && <GenericDeleteDialog entityId={id} entityType={entityType} onDelete={onDelete} />}
            </>
          )}
        </div>
      </div>
    </SheetHeader>
  )
}
