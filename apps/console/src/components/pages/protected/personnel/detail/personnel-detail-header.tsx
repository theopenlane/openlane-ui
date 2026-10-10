'use client'

import React, { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { User } from 'lucide-react'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { IdentityHolderUserStatus, type IdentityHolderQuery, type UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { UserStatusBadge } from '@/components/shared/enum-mapper/user-status-enum'
import { MergeRecordsSheet } from '@/components/shared/merge-records/merge-records-sheet'
import { personnelMergeConfig } from '@/components/shared/merge-records/configs/personnel-merge-config'
import { deleteMenuAction, mergeMenuAction } from '@/components/shared/crud-base/slideout-header'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'

interface PersonnelDetailHeaderProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEditPersonnel: boolean
  canDeletePersonnel: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
  onMergeComplete?: () => void
}

const PersonnelDetailHeader: React.FC<PersonnelDetailHeaderProps> = ({
  personnel,
  isEditing,
  canEditPersonnel,
  canDeletePersonnel,
  onEdit,
  onCancel,
  onDeleteClick,
  handleUpdateField,
  onMergeComplete,
}) => {
  const { register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'fullName' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const originalValueRef = useRef<string>('')
  const escapedRef = useRef(false)
  const [mergeOpen, setMergeOpen] = useState(false)

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
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
          {personnel.avatarRemoteURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={personnel.avatarRemoteURL} referrerPolicy="no-referrer" alt={personnel.fullName ?? 'Personnel photo'} className="h-full w-full object-contain p-1" />
          ) : (
            <User size={24} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
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
            {personnel.status && personnel.status !== IdentityHolderUserStatus.ACTIVE && personnel.status !== IdentityHolderUserStatus.INACTIVE && <UserStatusBadge status={personnel.status} />}
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

      <DetailHeaderActions
        isEditing={isEditing}
        onCancel={onCancel}
        onEdit={canEditPersonnel ? onEdit : undefined}
        editLabel="Edit personnel"
        menuAnchor={elementAnchor('personnel-actions-menu')}
        menuActions={[canEditPersonnel && mergeMenuAction(() => setMergeOpen(true)), canDeletePersonnel && deleteMenuAction(onDeleteClick)]}
      />
      {canEditPersonnel && <MergeRecordsSheet open={mergeOpen} onOpenChange={setMergeOpen} config={personnelMergeConfig} primaryId={personnel.id} onMergeComplete={onMergeComplete} />}
    </div>
  )
}

export default PersonnelDetailHeader
