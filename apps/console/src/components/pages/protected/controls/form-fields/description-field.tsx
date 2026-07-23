'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { ControlControlSource, SubcontrolControlSource, type ControlDiscussionFieldsFragment, type SubcontrolDiscussionFieldsFragment } from '@repo/codegen/src/schema.ts'
import { hasPlaceholderText } from '@/components/shared/plate/plate-utils'
import { Callout } from '@/components/shared/callout/callout'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string | Value
  isEditAllowed?: boolean
  discussionData?: ControlDiscussionFieldsFragment | SubcontrolDiscussionFieldsFragment
  systemCreated: boolean
  source?: ControlControlSource | SubcontrolControlSource
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue, isEditAllowed, discussionData, systemCreated, source }) => {
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
      {(source === ControlControlSource.TEMPLATE || source === SubcontrolControlSource.TEMPLATE) && hasPlaceholderText(initialValue) && (
        <Callout variant="warning" compact className="mb-2">
          This description still contains template placeholder text (e.g. <code>{'{{ ... }}'}</code>) that should be reviewed and filled in.
        </Callout>
      )}
      <div className={'min-h-5'}>
        {systemCreated ? (
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: initialValue as string }} />
        ) : (
          <PlateEditor
            toolbarClassName="-mt-20"
            placeholder="No description set"
            key={JSON.stringify(initialValue)}
            userData={userData}
            initialValue={initialValue}
            entity={discussionData}
            readonly={true}
            variant="readonly"
          />
        )}
      </div>
    </div>
  )
}

export default DescriptionField
