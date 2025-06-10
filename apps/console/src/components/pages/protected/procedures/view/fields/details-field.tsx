import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema.ts'
import { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'
import { Card } from '@repo/ui/cardpanel'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, procedure }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="procedure" className="block text-sm font-medium text-muted-foreground mb-1">
        Procedure
      </label>
      <Controller
        control={form.control}
        name="details"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} variant="basic" placeholder="Write your control description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto p-2">{procedure?.details && plateEditorHelper.convertToReadOnly(procedure.details as string, 0)}</div>
    </Card>
  )
}

export default DetailsField
