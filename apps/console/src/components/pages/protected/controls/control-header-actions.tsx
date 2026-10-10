'use client'

import React from 'react'
import { CopyPlus } from 'lucide-react'
import { hasPermission, canDelete, canEdit } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import type { TAccessRole } from '@/types/authz'
import { useSession } from 'next-auth/react'
import { deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'

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
  const { data: session } = useSession()
  const canEditControl = canEdit(permissionRoles, session)
  const canDeleteControl = canDelete(permissionRoles)
  const canCloneControl = showClone && hasPermission(orgPermissionRoles, AccessEnum.CanCreateControl, session)

  return (
    <DetailHeaderActions
      isEditing={isEditing}
      onCancel={onCancel}
      onAskAI={onAskAI}
      onEdit={canEditControl ? onEdit : undefined}
      editLabel="Edit control"
      menuAnchor={elementAnchor('control-actions-menu')}
      menuActions={[
        canCloneControl && {
          key: 'clone',
          label: 'Clone Control',
          icon: <CopyPlus size={16} strokeWidth={2} />,
          href: `/controls/${controlId}/clone-control?mapControlId=${controlId}`,
        },
        canDeleteControl && { ...deleteMenuAction(onDeleteClick), anchor: elementAnchor('control-delete-button') },
      ]}
    />
  )
}

export default ControlHeaderActions
