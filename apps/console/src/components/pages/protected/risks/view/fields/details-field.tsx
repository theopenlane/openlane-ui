'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import { RiskDiscussionFieldsFragment, RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import { Value } from 'platejs'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditAllowed?: boolean
  clearData?: boolean
  onCleared?: () => void
  discussionData?: RiskDiscussionFieldsFragment
  isCreate?: boolean
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, risk, isEditAllowed = true, clearData, onCleared, discussionData, isCreate }) => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)
  const { control } = form

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      <label htmlFor="risk" className="block text-sm font-medium text-muted-foreground mb-1">
        Details
      </label>
      <Controller
        control={control}
        name="detailsJSON"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            initialValue={risk?.detailsJSON ? (risk?.detailsJSON as Value) : (risk?.details ?? undefined)}
            clearData={clearData}
            entity={discussionData}
            onClear={() => onCleared?.()}
            onChange={field.onChange}
            isCreate={isCreate}
            placeholder="Write your risk description"
          />
        )}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="risk" className="block text-lg font-medium text-muted-foreground mb-1">
        Details
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto">
        <PlateEditor
          key={JSON.stringify(risk?.detailsJSON ?? risk?.details)}
          userData={userData}
          initialValue={risk?.detailsJSON ? (risk?.detailsJSON as Value) : (risk?.details ?? undefined)}
          entity={discussionData}
          readonly={true}
          variant="readonly"
        />
      </div>
    </Card>
  )
}

export default DetailsField
