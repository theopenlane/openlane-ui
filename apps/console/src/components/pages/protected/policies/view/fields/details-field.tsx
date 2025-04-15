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
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} isScrollable={true} variant="basic" placeholder="Write your control description" />}
      />
    </div>
  ) : (
    <>
      <div className="flex">
        <h2 className="text-lg font-semibold">Policy</h2>
      </div>
      <div className="!mt-0">{policy?.details && plateEditorHelper.convertToReadOnly(policy.details as string, 0)}</div>
    </>
  )
}

export default DetailsField
