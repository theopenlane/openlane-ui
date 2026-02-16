'use client'

import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import { SheetHeader } from '@repo/ui/sheet'
import { LinkIcon, PanelRightClose, Pencil } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { GenericDeleteDialog } from './dialog/delete-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'

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
}

export const GenericSheetHeader = ({ close, isEditing, isCreate, setIsEditing, isPending, isEditAllowed, handleCancelEdit, formId, entityType, onDelete }: GenericSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const handleCopyLink = () => {
    if (!id) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}?id=${id}`
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
      <div className="flex items-center justify-between">
        {!isCreate ? <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={close} /> : <div className="h-6" />}
        <div className="flex justify-end gap-2">
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
