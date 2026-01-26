'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Value } from 'platejs'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { ControlDiscussionFieldsFragment, SubcontrolDiscussionFieldsFragment } from '@repo/codegen/src/schema.ts'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string | Value
  isEditAllowed?: boolean
  discussionData?: ControlDiscussionFieldsFragment | SubcontrolDiscussionFieldsFragment
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue, isEditAllowed, discussionData }) => {
  const { subcontrolId } = useParams<{ subcontrolId: string | undefined; id: string }>()
  const { control } = useFormContext()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  const label = (
    <label htmlFor="description" className="block text-lg my-1 font-semibold">
      {subcontrolId ? 'Subcontrol Description' : 'Control Description'}
    </label>
  )

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      {label}
      <Controller
        control={control}
        name="descriptionJSON"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            entity={discussionData}
            initialValue={initialValue}
            onChange={(val) => {
              field.onChange(val)
            }}
            placeholder="Write your control description"
          />
        )}
      />
    </div>
  ) : (
    <div className="w-full">
      {label}
      <div className={'min-h-[20px]'}>
        <PlateEditor placeholder="No description set" key={JSON.stringify(initialValue)} userData={userData} initialValue={initialValue} entity={discussionData} readonly={true} variant="readonly" />
      </div>
    </div>
  )
}

export default DescriptionField
