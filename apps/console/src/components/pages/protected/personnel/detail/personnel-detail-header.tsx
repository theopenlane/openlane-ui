'use client'

import React, { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { MoreHorizontal, Trash2, User, PencilIcon } from 'lucide-react'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { IdentityHolderUserStatus, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { PersonnelStatusBadge } from '@/components/shared/enum-mapper/personnel-enum'

interface PersonnelDetailHeaderProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEditPersonnel: boolean
  canDeletePersonnel: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
}

const PersonnelDetailHeader: React.FC<PersonnelDetailHeaderProps> = ({ personnel, isEditing, canEditPersonnel, canDeletePersonnel, onEdit, onCancel, onDeleteClick, handleUpdateField }) => {
  const { register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'fullName' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const originalValueRef = useRef<string>('')
  const escapedRef = useRef(false)

  const handleBlur = async () => {
    if (escapedRef.current) {
      escapedRef.current = false
      return
    }
    if (localValue !== originalValueRef.current) {
      await handleUpdateField({ fullName: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = () => {
    escapedRef.current = true
    setInlineEditing(null)
  }

  const startEditing = () => {
    if (!canEditPersonnel || isEditing) return
    const current = personnel.fullName ?? ''
    originalValueRef.current = current
    setLocalValue(current)
    setInlineEditing('fullName')
  }

  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
          {personnel.avatarRemoteURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={personnel.avatarRemoteURL} referrerPolicy="no-referrer" alt={personnel.fullName ?? 'Personnel photo'} className="h-full w-full object-contain p-1" />
          ) : (
            <User size={24} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 min-w-0">
            {isEditing ? (
              <Input {...register('fullName')} className="text-2xl font-semibold h-auto py-1" />
            ) : inlineEditing === 'fullName' ? (
              <Input
                autoFocus
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="text-2xl font-semibold h-auto py-1"
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') handleEscape()
                }}
              />
            ) : (
              <HoverPencilWrapper showPencil={canEditPersonnel} onPencilClick={startEditing} className="min-w-0">
                <h1 className="text-2xl font-semibold truncate" onDoubleClick={startEditing}>
                  {personnel.fullName}
                </h1>
              </HoverPencilWrapper>
            )}
            {personnel.isActive ? (
              <Badge variant="green" className="shrink-0">
                Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="shrink-0">
                Inactive
              </Badge>
            )}
            {personnel.isOpenlaneUser && (
              <Badge variant="outline" className="shrink-0">
                Openlane User
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {personnel.status && personnel.status !== IdentityHolderUserStatus.ACTIVE && personnel.status !== IdentityHolderUserStatus.INACTIVE && <PersonnelStatusBadge status={personnel.status} />}
            {personnel.team && (
              <Badge variant="outline" className="text-muted-foreground">
                {personnel.team}
              </Badge>
            )}
            {personnel.title && (
              <Badge variant="outline" className="text-muted-foreground">
                {personnel.title}
              </Badge>
            )}
          </div>
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
            {canEditPersonnel && (
              <Button type="button" variant="secondary" onClick={onEdit} aria-label="Edit personnel" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
                Edit
              </Button>
            )}
            {canDeletePersonnel && (
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

export default PersonnelDetailHeader
