'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { PencilIcon, MoreHorizontal, Trash2, Building2 } from 'lucide-react'
import { canEdit, canDelete } from '@/lib/authz/utils'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import type { TAccessRole } from '@/types/authz'
import type { EntityQuery } from '@repo/codegen/src/schema'

interface VendorDetailHeaderProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  permissionRoles?: TAccessRole[]
}

const VendorDetailHeader: React.FC<VendorDetailHeaderProps> = ({ vendor, isEditing, onEdit, onCancel, onDeleteClick, permissionRoles }) => {
  const canEditVendor = canEdit(permissionRoles)
  const canDeleteVendor = canDelete(permissionRoles)
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 size={24} className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
          {vendor.displayName && <p className="text-sm text-muted-foreground">{vendor.displayName}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <CancelButton onClick={onCancel} />
            <SaveButton />
          </div>
        ) : (
          <>
            {canEditVendor && (
              <Button type="button" variant="secondary" onClick={onEdit} aria-label="Edit vendor" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
                Edit
              </Button>
            )}
            {canDeleteVendor && (
              <Menu
                trigger={
                  <Button type="button" variant="secondary" className="h-8 px-2">
                    <MoreHorizontal size={16} />
                  </Button>
                }
                content={
                  <button onClick={onDeleteClick} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer text-destructive">
                    <Trash2 size={16} strokeWidth={2} />
                    <span>Delete</span>
                  </button>
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VendorDetailHeader
