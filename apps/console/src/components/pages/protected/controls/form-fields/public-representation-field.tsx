'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

interface PublicRepresentationFieldProps {
  isEditing: boolean
  initialValue: string | Value
  isEditAllowed?: boolean
}

const PublicRepresentationField: React.FC<PublicRepresentationFieldProps> = ({ isEditing, initialValue, isEditAllowed }) => {
  const { subcontrolId } = useParams<{ subcontrolId: string | undefined; id: string }>()
  const { control } = useFormContext()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  const label = (
    <label htmlFor="publicRepresentation" className="block text-lg my-1">
      <div className="flex items-center">
        <span className="mr-1 font-semibold">{subcontrolId ? 'Public Representation' : 'Public Representation'}</span>
        <SystemTooltip
          icon={<InfoIcon size={14} className="text-muted-foreground" />}
          content="This is the public wording that could be shown to external users in places such as your Trust Center or questionnaire responses."
        />
      </div>
    </label>
  )

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      {label}
      <Controller
        control={control}
        name="publicRepresentation"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            initialValue={initialValue}
            onChange={(val) => {
              field.onChange(val)
            }}
            variant="standard"
            placeholder="Write the public wording for this control"
          />
        )}
      />
    </div>
  ) : (
    <div className="w-full">
      {label}
      <div className={'min-h-5'}>
        <PlateEditor
          placeholder="No public representation set"
          key={JSON.stringify(initialValue)}
          userData={userData}
          initialValue={initialValue}
          readonly={true}
          variant="readonly"
          toolbarClassName="hidden"
        />
      </div>
    </div>
  )
}

export default PublicRepresentationField
