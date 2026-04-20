'use client'

import React, { useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { MoreHorizontal, Trash2, PencilIcon, TriangleAlert } from 'lucide-react'
import { canDelete } from '@/lib/authz/utils'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import Menu from '@/components/shared/menu/menu'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import type { TAccessRole } from '@/types/authz'
import { type GetRiskByIdQuery, type UpdateRiskInput } from '@repo/codegen/src/schema'

interface RiskDetailHeaderProps {
  risk: GetRiskByIdQuery['risk']
  isEditing: boolean
  canEditRisk: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  permissionRoles?: TAccessRole[]
  handleUpdateField: (input: UpdateRiskInput) => Promise<void>
}

const RiskDetailHeader: React.FC<RiskDetailHeaderProps> = ({ risk, isEditing, canEditRisk, onEdit, onCancel, onDeleteClick, permissionRoles, handleUpdateField }) => {
  const canDeleteRisk = canDelete(permissionRoles)
  const { setValue, register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'name' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const originalValueRef = useRef<string>('')

  const handleBlur = async (field: 'name') => {
    if (localValue !== originalValueRef.current) {
      setValue(field, localValue)
      await handleUpdateField({ [field]: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = (field: 'name') => {
    setValue(field, originalValueRef.current)
    setInlineEditing(null)
  }

  const startEditing = (field: 'name') => {
    if (!canEditRisk || isEditing) return
    const current = field === 'name' ? risk.name : ''
    originalValueRef.current = current
    setLocalValue(current)
    setInlineEditing(field)
  }

  const renderInlineField = (field: 'name') => {
    return (
      <Input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={'text-2xl font-semibold h-auto py-1 min-w-180'}
        onBlur={() => handleBlur(field)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') handleEscape(field)
        }}
      />
    )
  }

  const sevColor = (sev: string) => {
    if (sev.toLowerCase() === 'moderate') return 'var(--color-severity-medium)'

    return `var(--color-severity-${sev.toLowerCase()})`
  }
  return (
    <>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="roup/logo relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden border-0 p-0 cursor-pointer">
            <TriangleAlert size={24} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {isEditing ? (
              <Input {...register('name')} className="text-2xl font-semibold h-auto py-1 min-w-180" />
            ) : inlineEditing === 'name' ? (
              renderInlineField('name')
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <HoverPencilWrapper showPencil={canEditRisk} onPencilClick={() => startEditing('name')} className="min-w-0">
                  <h1 className="text-2xl font-semibold break-words" onDoubleClick={() => startEditing('name')}>
                    {risk.name}
                  </h1>
                </HoverPencilWrapper>
                {risk.impact && (
                  <Badge
                    variant={'outline'}
                    className={`shrink-0 mt-2`}
                    style={{
                      backgroundColor: sevColor(risk.impact),
                    }}
                  >
                    {risk.impact}
                  </Badge>
                )}
              </div>
            )}
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
              {canEditRisk && (
                <Button type="button" variant="secondary" onClick={onEdit} aria-label="Edit risk" icon={<PencilIcon size={16} strokeWidth={2} />} iconPosition="left">
                  Edit
                </Button>
              )}
              {canDeleteRisk && (
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
    </>
  )
}

export default RiskDetailHeader
