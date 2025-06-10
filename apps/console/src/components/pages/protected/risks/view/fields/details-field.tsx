import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { RiskFieldsFragment } from '@repo/codegen/src/schema.ts'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, risk }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="risk" className="block text-sm font-medium text-muted-foreground mb-1">
        Details
      </label>
      <Controller
        control={form.control}
        name="details"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} variant="basic" placeholder="Write your risk description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="risk" className="block text-lg font-medium text-muted-foreground mb-1">
        Details
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto p-2">{risk?.details && plateEditorHelper.convertToReadOnly(risk.details as string, 0)}</div>
    </Card>
  )
}

export default DetailsField
