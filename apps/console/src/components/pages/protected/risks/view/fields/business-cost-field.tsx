import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { RiskFieldsFragment } from '@repo/codegen/src/schema.ts'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'

type TBusinessCostFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
}

const BusinessCostField: React.FC<TBusinessCostFieldProps> = ({ isEditing, form, risk }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="risk" className="block text-sm font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <Controller
        control={form.control}
        name="businessCosts"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} placeholder="Write your business costs description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="risk" className="block text-lg font-medium text-muted-foreground mb-1">
        Business Costs
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto">{risk?.businessCosts && plateEditorHelper.convertToReadOnly(risk.businessCosts as string)}</div>
    </Card>
  )
}

export default BusinessCostField
