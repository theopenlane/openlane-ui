'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'

type TBusinessCostFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditAllowed?: boolean
}

const BusinessCostField: React.FC<TBusinessCostFieldProps> = ({ isEditing, form, risk, isEditAllowed = true }) => {
  const plateEditorHelper = usePlateEditor()
  const { control } = form

  const shouldEdit = isEditing && isEditAllowed

  return shouldEdit ? (
    <div className="w-full">
      <label htmlFor="businessCosts" className="block text-sm font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <Controller
        control={control}
        name="businessCosts"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} placeholder="Write your business costs description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="businessCosts" className="block text-lg font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <div className={`!mt-4 bg-none max-h-[55vh] overflow-auto`}>{risk?.businessCosts && plateEditorHelper.convertToReadOnly(risk.businessCosts as string)}</div>
    </Card>
  )
}

export default BusinessCostField
