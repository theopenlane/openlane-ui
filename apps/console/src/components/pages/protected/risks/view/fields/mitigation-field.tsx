import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { RiskFieldsFragment } from '@repo/codegen/src/schema.ts'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema.ts'

type TMitigationFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
}

const MitigationField: React.FC<TMitigationFieldProps> = ({ isEditing, form, risk }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="risk" className="block text-sm font-medium text-muted-foreground mb-1">
        Mitigation
      </label>
      <Controller
        control={form.control}
        name="mitigation"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} placeholder="Write your mitigation description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="risk" className="block text-lg font-medium text-muted-foreground mb-1">
        Mitigation
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto p-2">{risk?.mitigation && plateEditorHelper.convertToReadOnly(risk.mitigation as string, 0)}</div>
    </Card>
  )
}

export default MitigationField
