'use client'

import React, { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { MoreHorizontal, Trash2, Building2, PencilIcon } from 'lucide-react'
import { canDelete } from '@/lib/authz/utils'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import type { TAccessRole } from '@/types/authz'
import type { EntityQuery, UpdateEntityInput } from '@repo/codegen/src/schema'

interface VendorDetailHeaderProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEditVendor: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  permissionRoles?: TAccessRole[]
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
}

const VendorDetailHeader: React.FC<VendorDetailHeaderProps> = ({ vendor, isEditing, canEditVendor, onEdit, onCancel, onDeleteClick, permissionRoles, handleUpdateField }) => {
  const canDeleteVendor = canDelete(permissionRoles)
  const { setValue, register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'name' | 'displayName' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const originalValueRef = useRef<string>('')

  const handleBlur = async (field: 'name' | 'displayName') => {
    if (localValue !== originalValueRef.current) {
      setValue(field, localValue)
      await handleUpdateField({ [field]: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = (field: 'name' | 'displayName') => {
    setValue(field, originalValueRef.current)
    setInlineEditing(null)
  }

  const startEditing = (field: 'name' | 'displayName') => {
    if (!canEditVendor || isEditing) return
    const current = (field === 'name' ? vendor.name : vendor.displayName) ?? ''
    originalValueRef.current = current
    setLocalValue(current)
    setInlineEditing(field)
  }

  const renderInlineField = (field: 'name' | 'displayName') => {
    return (
      <Input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={field === 'name' ? 'text-2xl font-semibold h-auto py-1' : 'text-sm h-auto py-0.5'}
        onBlur={() => handleBlur(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') handleEscape(field)
        }}
      />
    )
  }

  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 size={24} className="text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          {isEditing ? (
            <Input {...register('name')} className="text-2xl font-semibold h-auto py-1" />
          ) : inlineEditing === 'name' ? (
            renderInlineField('name')
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <HoverPencilWrapper showPencil={canEditVendor} onPencilClick={() => startEditing('name')} className="min-w-0">
                <h1 className="text-2xl font-semibold truncate" onDoubleClick={() => startEditing('name')}>
                  {vendor.name}
                </h1>
              </HoverPencilWrapper>
              {vendor.approvedForUse && (
                <Badge variant="green" className="shrink-0">
                  Approved
                </Badge>
              )}
            </div>
          )}
          {isEditing ? (
            <Input {...register('displayName')} className="text-sm h-auto py-0.5" placeholder="Display name" />
          ) : inlineEditing === 'displayName' ? (
            renderInlineField('displayName')
          ) : vendor.displayName ? (
            <HoverPencilWrapper showPencil={canEditVendor} onPencilClick={() => startEditing('displayName')}>
              <p className="text-sm text-muted-foreground" onDoubleClick={() => startEditing('displayName')}>
                {vendor.displayName}
              </p>
            </HoverPencilWrapper>
          ) : null}
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
