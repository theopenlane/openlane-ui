'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { type RiskRiskStatus, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { usePersistFormField, type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import RiskLabel from '../../risk-label'
import type { EditRisksFormData } from '../hooks/use-form-schema'

export type TRiskInlineEditField = 'status' | 'riskKindName' | 'riskCategoryName'

type TRiskInlineBadgeProps = {
  field: TRiskInlineEditField
  label: string
  variant: 'outline' | 'secondary'
  badgeClassName?: string
  showIcon: boolean
  labelProps: (value: string | undefined) => { status?: RiskRiskStatus; riskKindName?: string; riskCategoryName?: string }
  isEditing: boolean
  isInlineEditing: boolean
  canInlineEdit: boolean
  onStartInlineEdit: () => void
  onCloseInlineEdit: () => void
  handleUpdateField: (input: UpdateRiskInput, options?: TPersistOptions) => Promise<void>
}

const RiskInlineBadge: React.FC<TRiskInlineBadgeProps> = ({
  field,
  label,
  variant,
  badgeClassName,
  showIcon,
  labelProps,
  isEditing,
  isInlineEditing,
  canInlineEdit,
  onStartInlineEdit,
  onCloseInlineEdit,
  handleUpdateField,
}) => {
  const { control } = useFormContext<EditRisksFormData>()
  const persistField = usePersistFormField<EditRisksFormData>()

  const persist = (next: string) => {
    if (field === 'status') {
      const status = next as RiskRiskStatus
      return persistField('status', status, (options) => handleUpdateField({ status }, options))
    }
    const input: UpdateRiskInput = field === 'riskKindName' ? { riskKindName: next } : { riskCategoryName: next }
    return persistField(field, next, (options) => handleUpdateField(input, options))
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <Badge
        variant={variant}
        className={cn('shrink-0', badgeClassName, canInlineEdit && 'cursor-pointer')}
        onClick={() => {
          if (canInlineEdit) onStartInlineEdit()
        }}
      >
        <Controller
          name={field}
          control={control}
          render={({ field: ctrl }) => (
            <RiskLabel
              fieldName={field}
              {...labelProps(ctrl.value as string | undefined)}
              isEditing={isEditing || isInlineEditing}
              showIcon={showIcon}
              onChange={(val) => {
                const next = String(val)
                if (isEditing) {
                  ctrl.onChange(next)
                  return
                }
                onCloseInlineEdit()
                if (next === ctrl.value) {
                  return
                }
                void persist(next)
              }}
              onClose={onCloseInlineEdit}
            />
          )}
        />
      </Badge>
    </div>
  )
}

export default RiskInlineBadge
