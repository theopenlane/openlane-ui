'use client'

import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema.ts'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditPolicyMetadataFormData>
  policy: InternalPolicyByIdFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, policy }) => {
  const plateEditorHelper = usePlateEditor()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller
        control={form.control}
        name={`${policy?.detailsJSON ? 'detailsJSON' : 'details'}`}
        render={({ field }) => (
          <PlateEditor userData={userData} policy={policy} initialValue={policy?.detailsJSON ?? policy?.details} onChange={field.onChange} placeholder="Write your policy description" />
        )}
      />
    </div>
  ) : (
    <div className="!mt-4 min-h-[20px]">{(policy?.details || policy?.detailsJSON) && plateEditorHelper.convertToReadOnly(policy.detailsJSON ?? policy.details)}</div>
  )
}

export default DetailsField
