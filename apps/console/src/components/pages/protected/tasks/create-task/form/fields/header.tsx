'use client'

import { useNotification } from '@/hooks/useNotification'
import { Badge } from '@repo/ui/badge'
import { Copy, LayoutTemplate, X } from 'lucide-react'
import React, { useState } from 'react'
import DeleteTaskDialog from '../../dialog/delete-task-dialog'
import { deleteMenuAction, copyLinkMenuAction, SlideoutHeader, type SlideoutMenuAction } from '@/components/shared/crud-base/slideout-header'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canDelete } from '@/lib/authz/utils.ts'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface TasksSheetHeaderProps {
  close: () => void
  isEditing: boolean
  setIsEditing: (value: boolean) => void
  title?: string | null
  isEditAllowed: boolean
  id: string | null
  onDuplicate: () => void
  canDuplicate: boolean
  sharePath: string
  onDeleted: () => void
  isTemplate: boolean
  onTemplateChange: (isTemplate: boolean) => void
  onUseTemplate: () => void
}

const TasksSheetHeader = ({
  close,
  isEditing,
  setIsEditing,
  title,
  isEditAllowed,
  id,
  onDuplicate,
  canDuplicate,
  sharePath,
  onDeleted,
  isTemplate,
  onTemplateChange,
  onUseTemplate,
}: TasksSheetHeaderProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectTypes.TASK, id)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const isDeleteAllowed = !!title && !!id && canDelete(permission?.roles)

  const handleCopyLink = () => {
    if (!sharePath) {
      return
    }

    navigator.clipboard
      .writeText(`${window.location.origin}${sharePath}`)
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

  const menuActions: SlideoutMenuAction[] = [
    copyLinkMenuAction(handleCopyLink),
    { key: 'duplicate', label: 'Duplicate', icon: <Copy size={16} strokeWidth={2} />, onClick: onDuplicate, disabled: !canDuplicate },
    ...(!isTemplate && isEditAllowed && !isEditing
      ? [{ key: 'save-as-template', label: 'Save as template', icon: <LayoutTemplate size={16} strokeWidth={2} />, onClick: () => onTemplateChange(true) }]
      : []),
    ...(isDeleteAllowed ? [deleteMenuAction(() => setIsDeleteOpen(true))] : []),
  ]

  return (
    <>
      <SlideoutHeader
        title={title ?? 'Task'}
        titleAdornment={
          isTemplate ? (
            <Badge variant="blue" className="gap-1">
              Template
              {isEditAllowed && !isEditing && (
                <button type="button" aria-label="Remove template" className="cursor-pointer" onClick={() => onTemplateChange(false)}>
                  <X size={12} />
                </button>
              )}
            </Badge>
          ) : undefined
        }
        onClose={close}
        onEdit={!isEditing && isEditAllowed ? () => setIsEditing(true) : undefined}
        primaryAction={isTemplate && !isEditing ? { label: 'Use template', icon: <LayoutTemplate size={16} />, onClick: onUseTemplate, disabled: !canDuplicate } : undefined}
        menuActions={menuActions}
      />
      {isDeleteAllowed && <DeleteTaskDialog taskName={title} taskId={id} onDeleted={onDeleted} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} />}
    </>
  )
}

export default TasksSheetHeader
