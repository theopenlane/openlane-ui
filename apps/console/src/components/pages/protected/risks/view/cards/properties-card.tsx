'use client'

import React, { useState } from 'react'
import { RiskFieldsFragment, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Binoculars, Circle, CircleAlert, CircleHelp, Folder, Gauge, Tag } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import RiskLabel from '@/components/pages/protected/risks/risk-label'
import useEscapeKey from '@/hooks/useEscapeKey'
import { Card } from '@repo/ui/cardpanel'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TPropertiesCardProps = {
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
  isCreate?: boolean
}

type Fields = 'riskKindName' | 'riskCategoryName' | 'score' | 'impact' | 'likelihood' | 'status'

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, risk, isCreate, isEditing, isEditAllowed = true, handleUpdate }) => {
  const { control } = form
  const [editingField, setEditingField] = useState<Fields | null>(null)

  const toggleEditing = (field: Fields) => {
    if (!isEditing && isEditAllowed) setEditingField(field)
  }

  useEscapeKey(() => {
    if (editingField) {
      const value = risk?.[editingField]
      form.setValue(editingField, value || '')
      setEditingField(null)
    }
  })

  const renderRiskLabelField = <T extends 'score' | 'impact' | 'likelihood' | 'status' | 'riskKindName' | 'riskCategoryName'>(fieldName: T, label: string) => {
    const isFieldEditing = isEditing || editingField === fieldName
    const showPencil = editingField !== fieldName && !isEditing

    return (
      <FieldRow label={label} onDoubleClick={() => toggleEditing(fieldName)} isEditAllowed={isEditAllowed} showPencil={showPencil}>
        <Controller
          name={fieldName as keyof EditRisksFormData}
          control={control}
          render={({ field, fieldState }) => {
            return (
              <div className="flex flex-col gap-1 w-[150px] min-w-0">
                <RiskLabel
                  selectFieldClassname={'w-full'}
                  fieldName={fieldName}
                  isEditing={isFieldEditing}
                  score={fieldName === 'score' ? (field.value as number) : undefined}
                  impact={fieldName === 'impact' ? (field.value as RiskRiskImpact) : undefined}
                  likelihood={fieldName === 'likelihood' ? (field.value as RiskRiskLikelihood) : undefined}
                  status={fieldName === 'status' ? (field.value as RiskRiskStatus) : undefined}
                  riskKindName={fieldName === 'riskKindName' ? (field.value as string) : undefined}
                  riskCategoryName={fieldName === 'riskCategoryName' ? (field.value as string) : undefined}
                  onChange={(val) => {
                    field.onChange(val)

                    if (fieldName === 'score') return

                    if (!isEditing && handleUpdate) {
                      handleUpdate({ [fieldName]: val } as UpdateRiskInput)
                      setEditingField(null)
                    }
                  }}
                  onMouseUp={(val) => {
                    if (!isEditing && handleUpdate) {
                      handleUpdate({ [fieldName]: val } as UpdateRiskInput)
                      setEditingField(null)
                    }
                  }}
                  onClose={() => setEditingField(null)}
                />
                {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
              </div>
            )
          }}
        />
      </FieldRow>
    )
  }

  if (!isCreate) {
    return (
      <div>
        <div className="flex flex-col gap-4">
          {renderRiskLabelField('riskKindName', 'Type')}
          {renderRiskLabelField('riskCategoryName', 'Category')}
          {renderRiskLabelField('score', 'Score')}
          {renderRiskLabelField('impact', 'Impact')}
          {renderRiskLabelField('likelihood', 'Likelihood')}
          {renderRiskLabelField('status', 'Status')}
        </div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="m-1">{renderRiskLabelField('riskKindName', 'Type')}</div>
      <div className="m-1">{renderRiskLabelField('riskCategoryName', 'Category')}</div>
      <div className="m-1">{renderRiskLabelField('score', 'Score')}</div>
      <div className="m-1">{renderRiskLabelField('impact', 'Impact')}</div>
      <div className="m-1">{renderRiskLabelField('likelihood', 'Likelihood')}</div>
      <div className="m-1">{renderRiskLabelField('status', 'Status')}</div>
    </Card>
  )
}

export default PropertiesCard

const FieldRow = ({
  label,
  children,
  onDoubleClick,
  isEditAllowed,
  showPencil,
}: {
  label: string
  children?: React.ReactNode
  onDoubleClick?: () => void
  isEditAllowed?: boolean
  showPencil: boolean
}) => {
  const getFieldIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'type':
      case 'category':
        return <Folder size={16} className="text-brand" />
      case 'score':
        return <Gauge size={16} className="text-brand" />
      case 'impact':
        return <CircleAlert size={16} className="text-brand" />
      case 'likelihood':
        return <CircleHelp size={16} className="text-brand" />
      case 'status':
        return <Binoculars size={16} className="text-brand" />
      case 'tags':
        return <Tag size={16} className="text-brand" />
      default:
        return <Circle size={16} className="text-brand" />
    }
  }

  return (
    <div className={`flex justify-between items-center border-b border-border pb-3`}>
      <div className="flex gap-2 w-[200px] items-center">
        {getFieldIcon(label)}
        <span className="text-sm">{label}</span>
      </div>
      <HoverPencilWrapper showPencil={showPencil} className={`w-[200px] ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
        <div
          onDoubleClick={() => {
            if (isEditAllowed && onDoubleClick) onDoubleClick()
          }}
          className="truncate text-sm"
        >
          {children}
        </div>
      </HoverPencilWrapper>
    </div>
  )
}
