'use client'

import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import { ProcedureDiscussionFieldsFragment, ProcedureByIdFragment } from '@repo/codegen/src/schema.ts'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import { Value } from 'platejs'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
  discussionData?: ProcedureDiscussionFieldsFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, procedure, discussionData }) => {
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
        name="detailsJSON"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            initialValue={procedure?.detailsJSON ? (procedure?.detailsJSON as Value) : (procedure?.details ?? undefined)}
            entity={discussionData}
            onChange={field.onChange}
            placeholder="Write your procedure description"
          />
        )}
      />
    </div>
  ) : (
    <div className={`!mt-4 min-h-[20px]`}>
      <PlateEditor
        key={JSON.stringify(procedure.detailsJSON ?? procedure.details)}
        userData={userData}
        initialValue={procedure?.detailsJSON ? (procedure?.detailsJSON as Value) : (procedure?.details ?? undefined)}
        entity={discussionData}
        readonly={true}
        variant="readonly"
      />
    </div>
  )
}

export default DetailsField
