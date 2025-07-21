import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import React from 'react'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditPolicyMetadataFormData>
  policy: InternalPolicyByIdFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, policy }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller
        control={form.control}
        name="details"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} placeholder="Write your control description" />}
      />
    </div>
  ) : (
    <div className="!mt-4 bg-none p-2">{policy?.details && plateEditorHelper.convertToReadOnly(policy.details as string, 0)}</div>
  )
}

export default DetailsField
