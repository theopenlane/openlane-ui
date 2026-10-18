'use client'

import { activatable } from '@repo/ui/lib/a11y'
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { TriangleAlert } from 'lucide-react'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { type GetRiskByIdQuery, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { cn } from '@repo/ui/lib/utils'
import { deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'

interface RiskDetailHeaderProps {
  risk: GetRiskByIdQuery['risk']
  isEditing: boolean
  canEditRisk: boolean
  onEdit: (e: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  canDeleteRisk: boolean
  handleUpdateField: (input: UpdateRiskInput) => Promise<void>
}

const RiskDetailHeader: React.FC<RiskDetailHeaderProps> = ({ risk, isEditing, canEditRisk, onEdit, onCancel, onDeleteClick, canDeleteRisk, handleUpdateField }) => {
  const { setValue, register } = useFormContext()
  const [inlineEditing, setInlineEditing] = useState<'name' | null>(null)
  const [localValue, setLocalValue] = useState('')
  const [originalValue, setOriginalValue] = useState<string>('')

  const handleBlur = async (field: 'name') => {
    if (localValue !== originalValue) {
      setValue(field, localValue)
      await handleUpdateField({ [field]: localValue })
    }
    setInlineEditing(null)
  }

  const handleEscape = (field: 'name') => {
    setValue(field, originalValue)
    setInlineEditing(null)
  }

  const startEditing = (field: 'name') => {
    if (!canEditRisk || isEditing) return
    const current = field === 'name' ? risk.name : ''
    setOriginalValue(current)
    setLocalValue(current)
    setInlineEditing(field)
  }

  const renderInlineField = (field: 'name') => {
    return (
      <Input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="text-2xl font-semibold h-auto py-1 w-full"
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
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden border-0 p-0 cursor-pointer">
            <TriangleAlert size={24} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {isEditing ? (
              <Input {...register('name')} className="text-2xl font-semibold h-auto py-1 w-full" />
            ) : inlineEditing === 'name' ? (
              renderInlineField('name')
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <HoverPencilWrapper showPencil={canEditRisk} onPencilClick={() => startEditing('name')} className="min-w-0">
                  <h1 className="text-2xl font-semibold break-words">
                    <span className={cn(canEditRisk && 'cursor-pointer')} {...activatable(() => startEditing('name'))}>
                      {risk.name}
                    </span>
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

        <DetailHeaderActions
          isEditing={isEditing}
          onCancel={onCancel}
          onEdit={canEditRisk ? onEdit : undefined}
          editLabel="Edit risk"
          menuAnchor={elementAnchor('risk-actions-menu')}
          menuActions={[canDeleteRisk && { ...deleteMenuAction(onDeleteClick), anchor: elementAnchor('risk-delete-button') }]}
        />
      </div>
    </>
  )
}

export default RiskDetailHeader
