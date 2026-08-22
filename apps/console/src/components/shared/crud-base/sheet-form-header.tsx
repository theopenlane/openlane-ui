'use client'

import React, { useState } from 'react'
import { GenericDeleteDialog } from './dialog/delete-dialog'
import { SlideoutHeader, copyLinkMenuAction, deleteMenuAction, type SlideoutMenuAction } from './slideout-header'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

export type SheetHeaderMode = 'view' | 'edit' | 'create'

export type SheetDeleteAction = {
  entityId: string
  onDelete: (id: string) => Promise<void>
}

export type SheetFormHeaderProps = {
  mode: SheetHeaderMode
  entityType: ObjectTypes
  displayName?: string
  close?: () => void
  edit?: () => void
  copyLink?: () => void
  remove?: SheetDeleteAction
  extraMenuActions?: SlideoutMenuAction[]
  titleAs?: React.ElementType
}

export const SheetFormHeader = ({ mode, entityType, displayName, close, edit, copyLink, remove, extraMenuActions = [], titleAs }: SheetFormHeaderProps) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const entityLabel = displayName ?? toHumanLabel(entityType)
  const isCreate = mode === 'create'
  const heading = isCreate ? `Create ${entityLabel}` : entityLabel

  const menuActions: SlideoutMenuAction[] = [
    ...(!isCreate && copyLink ? [copyLinkMenuAction(copyLink)] : []),
    ...(mode === 'view' ? extraMenuActions : []),
    ...(!isCreate && remove ? [deleteMenuAction(() => setIsDeleteOpen(true))] : []),
  ]

  return (
    <>
      <SlideoutHeader title={heading} titleAs={titleAs} onClose={close} onEdit={mode === 'view' ? edit : undefined} menuActions={menuActions} />
      {!isCreate && remove && (
        <GenericDeleteDialog entityId={remove.entityId} entityType={entityType} displayName={displayName} onDelete={remove.onDelete} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
      )}
    </>
  )
}
