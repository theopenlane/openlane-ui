import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema.ts'
import { EditProcedureMetadataFormData } from '@/components/pages/protected/procedures/view/hooks/use-form-schema.ts'

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
    <>
      <div className="flex">
        <h2 className="text-lg font-semibold">Procedure</h2>
      </div>
      <div className="!mt-4">{procedure?.details && plateEditorHelper.convertToReadOnly(procedure.details as string, 0)}</div>
    </>
  )
}

export default DetailsField
