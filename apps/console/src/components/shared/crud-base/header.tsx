'use client'

import { useNotification } from '@/hooks/useNotification'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { SheetFormHeader, type SheetHeaderMode } from './sheet-form-header'
import { type SlideoutMenuAction } from './slideout-header'
import { type ObjectTypes } from '@repo/codegen/src/type-names'

interface GenericSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  isCreate: boolean
  isEditAllowed: boolean
  entityType: ObjectTypes
  displayName?: string
  onDelete?: (id: string) => Promise<void>
  entityId?: string | null
  basePath?: string
  extraMenuActions?: SlideoutMenuAction[]
  titleAs?: React.ElementType
}

export const GenericSheetHeader = ({
  close,
  isEditing,
  isCreate,
  setIsEditing,
  isEditAllowed,
  entityType,
  displayName,
  onDelete,
  entityId,
  basePath,
  extraMenuActions,
  titleAs,
}: GenericSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const id = entityId ?? searchParams.get('id')

  const mode: SheetHeaderMode = isCreate ? 'create' : isEditing ? 'edit' : 'view'

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
    <SheetFormHeader
      mode={mode}
      entityType={entityType}
      displayName={displayName}
      close={close}
      copyLink={handleCopyLink}
      edit={isEditAllowed ? () => setIsEditing(true) : undefined}
      remove={onDelete && id ? { entityId: id, onDelete } : undefined}
      extraMenuActions={extraMenuActions}
      titleAs={titleAs}
    />
  )
}
