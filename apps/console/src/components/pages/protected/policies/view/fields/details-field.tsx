'use client'

import React from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { type EditPolicyMetadataFormData } from '@/components/pages/protected/policies/view/hooks/use-form-schema.ts'
import { ExportExportFormat, ExportExportType, type InternalPolicyByIdFragment, type PolicyDiscussionFieldsFragment } from '@repo/codegen/src/schema.ts'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { type Value } from 'platejs'
import useFileExport from '@/components/shared/export/use-file-export.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditPolicyMetadataFormData>
  policy: InternalPolicyByIdFragment
  discussionData?: PolicyDiscussionFieldsFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, policy, discussionData }) => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { handleExport } = useFileExport()

  const handleExportPdf = () => {
    handleExport({
      exportType: ExportExportType.INTERNAL_POLICY,
      filters: JSON.stringify({ id: policy.id }),
      fields: null,
      format: ExportExportFormat.PDF,
    })
  }

  return isEditing ? (
    <div className="w-full relative">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller
        control={form.control}
        name="detailsJSON"
        render={({ field }) => (
          <PlateEditor
            key={`${policy.id}-${isEditing ? 'edit' : 'view'}`}
            userData={userData}
            initialValue={policy?.detailsJSON ? (policy?.detailsJSON as Value) : (policy?.details ?? undefined)}
            entity={discussionData}
            onChange={field.onChange}
            placeholder="Write your policy description"
          />
        )}
      />
    </div>
  ) : (
    <div className="min-h-5">
      <PlateEditor
        key={JSON.stringify(policy.detailsJSON ?? policy.details)}
        userData={userData}
        initialValue={policy?.detailsJSON ? (policy?.detailsJSON as Value) : (policy?.details ?? undefined)}
        entity={discussionData}
        readonly={true}
        variant="readonly"
        toolbarClassName="-mt-40"
        onExportPdf={handleExportPdf}
      />
    </div>
  )
}

export default DetailsField
