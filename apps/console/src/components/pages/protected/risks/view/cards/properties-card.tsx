'use client'

import React, { useState } from 'react'
import { RiskFieldsFragment, RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Binoculars, Circle, CircleAlert, CircleHelp, Folder, Gauge, Tag } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import RiskLabel from '@/components/pages/protected/risks/risk-label'
import useEscapeKey from '@/hooks/useEscapeKey'
import { Card } from '@repo/ui/cardpanel'

type TPropertiesCardProps = {
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
}

type Fields = 'riskType' | 'category' | 'score' | 'impact' | 'likelihood' | 'status'

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, risk, isEditing, isEditAllowed = true, handleUpdate }) => {
  const { control, getValues } = form
  const [editingField, setEditingField] = useState<Fields | null>(null)

  const toggleEditing = (field: Fields) => {
    if (!isEditing && isEditAllowed) setEditingField(field)
  }

  const handleBlur = (fieldName: keyof EditRisksFormData) => {
    if (isEditing || !handleUpdate || !risk) return

    const newValue = getValues(fieldName)
    const oldValue = risk[fieldName as keyof RiskFieldsFragment]

    if (newValue !== oldValue) {
      handleUpdate({ [fieldName]: newValue })
    }

    setEditingField(null)
  }

  useEscapeKey(() => {
    if (editingField) {
      const value = risk?.[editingField]
      form.setValue(editingField, value || '')
      setEditingField(null)
    }
  })

  const renderTextField = (fieldName: Fields, label: string, value?: string | null) => {
    const isFieldEditing = isEditing || editingField === fieldName

    return (
      <FieldRow label={label} onDoubleClick={() => toggleEditing(fieldName)} isEditAllowed={isEditAllowed}>
        {isFieldEditing ? (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => <Input {...field} value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''} onBlur={() => handleBlur(fieldName)} autoFocus />}
          />
        ) : (
          <div className={`truncate ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>{value || `No ${label}`}</div>
        )}
      </FieldRow>
    )
  }

  const renderRiskLabelField = <T extends 'score' | 'impact' | 'likelihood' | 'status'>(fieldName: T, label: string) => {
    const isFieldEditing = isEditing || editingField === fieldName

    return (
      <FieldRow label={label} onDoubleClick={() => toggleEditing(fieldName)} isEditAllowed={isEditAllowed}>
        <Controller
          name={fieldName as keyof EditRisksFormData}
          control={control}
          render={({ field, fieldState }) => {
            return (
              <div className="flex flex-col gap-1">
                <RiskLabel
                  isEditing={isFieldEditing}
                  score={fieldName === 'score' ? (field.value as number) : undefined}
                  impact={fieldName === 'impact' ? (field.value as RiskRiskImpact) : undefined}
                  likelihood={fieldName === 'likelihood' ? (field.value as RiskRiskLikelihood) : undefined}
                  status={fieldName === 'status' ? (field.value as RiskRiskStatus) : undefined}
                  onChange={(val) => {
                    field.onChange(val)

                    if (fieldName === 'score') {
                      return
                    }

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

  return (
    <Card className="p-4">
      <div className="m-1">{renderTextField('riskType', 'Type', risk?.riskType ?? undefined)}</div>
      <div className="m-1">{renderTextField('category', 'Category', risk?.category ?? undefined)}</div>
      <div className="m-1">{renderRiskLabelField('score', 'Score')}</div>
      <div className="m-1">{renderRiskLabelField('impact', 'Impact')}</div>
      <div className="m-1">{renderRiskLabelField('likelihood', 'Likelihood')}</div>
      <div className="m-1">{renderRiskLabelField('status', 'Status')}</div>
    </Card>
  )
}

export default PropertiesCard

const FieldRow = ({ label, children, onDoubleClick, isEditAllowed }: { label: string; children?: React.ReactNode; onDoubleClick?: () => void; isEditAllowed?: boolean }) => {
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
    <div className={`flex justify-between items-center`}>
      <div className="flex gap-2 w-[200px] items-center">
        {getFieldIcon(label)}
        <span>{label}</span>
      </div>
      <div className={`w-[200px] ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onDoubleClick={isEditAllowed ? onDoubleClick : undefined}>
        {children}
      </div>
    </div>
  )
}
