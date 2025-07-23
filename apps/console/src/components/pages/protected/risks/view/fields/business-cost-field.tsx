'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React, { useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { RiskFieldsFragment, UpdateRiskInput } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import { Value } from 'platejs'

type TBusinessCostFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditAllowed?: boolean
  handleUpdate?: (val: UpdateRiskInput) => void
}

const BusinessCostField: React.FC<TBusinessCostFieldProps> = ({ isEditing, form, risk, isEditAllowed = true, handleUpdate }) => {
  const plateEditorHelper = usePlateEditor()
  const [internalEditing, setInternalEditing] = useState(false)
  const { control, getValues } = form

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = async () => {
    if (isEditing) return

    const fieldValue = getValues('businessCosts')
    const html = await plateEditorHelper.convertToHtml(fieldValue as Value)

    handleUpdate?.({ businessCosts: html })
    setInternalEditing(false)
  }

  const shouldEdit = isEditing || internalEditing

  return shouldEdit ? (
    <div className="w-full">
      <label htmlFor="businessCosts" className="block text-sm font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <Controller
        control={control}
        name="businessCosts"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} onBlur={handleBlur} placeholder="Write your business costs description" />}
      />
    </div>
  ) : (
    <Card className="p-4" onClick={handleClick}>
      <label htmlFor="businessCosts" className="block text-lg font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto cursor-pointer">{risk?.businessCosts && plateEditorHelper.convertToReadOnly(risk.businessCosts as string)}</div>
    </Card>
  )
}

export default BusinessCostField
