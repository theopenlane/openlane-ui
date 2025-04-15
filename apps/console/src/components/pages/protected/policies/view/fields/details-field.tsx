import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditPolicyMetadataFormData>
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form }) => {
  const plateEditorHelper = usePlateEditor()
  const detailsValue = form.getValues('details')

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
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
        <h2 className="text-lg font-semibold">Policy</h2>
      </div>
      <div className="mt-0">{detailsValue && plateEditorHelper.convertToReadOnly(detailsValue as string, 0)}</div>
    </>
  )
}

export default DetailsField
