'use client'

import React from 'react'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, Circle, CircleAlert, CircleHelp, Folder, Gauge, Tag } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'
import RiskLabel from '@/components/pages/protected/risks/risk-label.tsx'

type TPropertiesCardProps = {
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditing: boolean
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ form, isEditing, risk }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Properties</h3>
      <div className="flex flex-col gap-4">
        {/* Type */}
        <div className="flex justify-between items-center">
          <FieldRow label="Type">
            {isEditing ? (
              <Controller name="riskType" control={form.control} render={({ field }) => <Input {...field} />} />
            ) : (
              <div className="flex items-center space-x-2">
                <p>{risk?.riskType}</p>
              </div>
            )}
          </FieldRow>
        </div>

        <div className="flex justify-between items-center">
          <FieldRow label="Category">
            {isEditing ? (
              <Controller name="category" control={form.control} render={({ field }) => <Input {...field} />} />
            ) : (
              <div className="flex items-center space-x-2">
                <p>{risk?.category}</p>
              </div>
            )}
          </FieldRow>
        </div>

        <div className="flex justify-between items-center">
          <FieldRow label="Score">
            <Controller
              name="score"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1">
                  <RiskLabel isEditing={isEditing} score={field.value} onChange={field.onChange} />
                  {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </FieldRow>
        </div>

        <div className="flex justify-between items-center">
          <FieldRow label="Impact">
            <Controller name="impact" control={form.control} render={({ field }) => <RiskLabel isEditing={isEditing} impact={field.value} onChange={field.onChange} />} />
          </FieldRow>
        </div>
        <div className="flex justify-between items-center">
          <FieldRow label="Likelihood">
            <Controller name="likelihood" control={form.control} render={({ field }) => <RiskLabel isEditing={isEditing} likelihood={field.value} onChange={field.onChange} />} />
          </FieldRow>
        </div>
        <div className="flex justify-between items-center">
          <FieldRow label="Status">
            <Controller name="status" control={form.control} render={({ field }) => <RiskLabel isEditing={isEditing} status={field.value} onChange={field.onChange} />} />
          </FieldRow>
        </div>
      </div>
    </Card>
  )
}

const FieldRow = ({ label, children }: { label: string; children?: React.ReactNode }) => {
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
    <>
      <div className="flex gap-2 w-[200px] items-center">
        {getFieldIcon(label)}
        <span>{label}</span>
      </div>
      <div className="w-[200px]">{children}</div>
    </>
  )
}

export default PropertiesCard
