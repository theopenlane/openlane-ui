'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { CopyPlus, PencilIcon, MoreHorizontal, Trash2, Sparkles } from 'lucide-react'
import { canCreate, canDelete, canEdit } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import Link from 'next/link'
import { SaveButton } from '@/components/shared/save-button/save-button.tsx'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button.tsx'
import type { TAccessRole } from '@/types/authz'

interface ControlHeaderActionsProps {
  controlId: string
  isEditing: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  onAskAI: () => void
  permissionRoles?: TAccessRole[]
  orgPermissionRoles?: TAccessRole[]
  showClone?: boolean
}

const ControlHeaderActions: React.FC<ControlHeaderActionsProps> = ({ controlId, isEditing, onEdit, onCancel, onDeleteClick, onAskAI, permissionRoles, orgPermissionRoles, showClone = true }) => {
  const canEditControl = canEdit(permissionRoles)
  const canDeleteControl = canDelete(permissionRoles)
  const canCloneControl = showClone && canCreate(orgPermissionRoles, AccessEnum.CanCreateControl)

  if (isEditing) {
    return (
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" className="h-8 px-2!" onClick={onAskAI} icon={<Sparkles size={16} />}>
          Ask AI
        </Button>
        <CancelButton onClick={onCancel} />
        <SaveButton />
      </div>
    )
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button variant="secondary" className="h-8 px-2!" onClick={onAskAI} icon={<Sparkles size={16} />}>
        Ask AI
      </Button>
      {canEditControl && (
        <Button type="button" variant="secondary" onClick={onEdit} aria-label="Edit control" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
          Edit
        </Button>
      )}
      {(canCloneControl || canDeleteControl) && (
        <Menu
          trigger={
            <Button type="button" variant="secondary" className="h-8 px-2">
              <MoreHorizontal size={16} />
            </Button>
          }
          content={
            <>
              {canCloneControl && (
                <Link href={`/controls/${controlId}/clone-control?mapControlId=${controlId}`}>
                  <button className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer">
                    <CopyPlus size={16} strokeWidth={2} />
                    <span>Clone Control</span>
                  </button>
                </Link>
              )}
              {canDeleteControl && (
                <button onClick={onDeleteClick} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer text-destructive">
                  <Trash2 size={16} strokeWidth={2} />
                  <span>Delete</span>
                </button>
              )}
            </>
          }
        />
      )}
    </div>
  )
}

export default ControlHeaderActions
