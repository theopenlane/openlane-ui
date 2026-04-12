'use client'

import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import { type RiskDiscussionFieldsFragment } from '@repo/codegen/src/schema'
import { type Value } from 'platejs'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

type TDetailsFieldProps = {
  isEditing: boolean
  initialValue?: string | Value
  isEditAllowed?: boolean
  clearData?: boolean
  onCleared?: () => void
  discussionData?: RiskDiscussionFieldsFragment
  isCreate?: boolean
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, initialValue, isEditAllowed = true, clearData, onCleared, discussionData, isCreate }) => {
  const { control } = useFormContext()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  const label = (
    <label htmlFor="details" className="block text-lg my-1">
      <div className="flex items-center">
        <span className="mr-1 font-semibold">Details</span>
        <SystemTooltip
          icon={<InfoIcon size={14} className="text-muted-foreground" />}
          content="Detailed information about the risk, including context, potential impact, and any relevant background. This helps in understanding the risk comprehensively and making informed decisions."
        />
      </div>
    </label>
  )

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      {label}
      <Controller
        control={control}
        name="detailsJSON"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            clearData={clearData}
            entity={discussionData}
            onClear={() => onCleared?.()}
            initialValue={initialValue}
            onChange={(val) => {
              field.onChange(val)
            }}
            isCreate={isCreate}
            placeholder="Write detailed information about the risk"
          />
        )}
      />
    </div>
  ) : (
    <div className="w-full">
      {label}
      <div className={'min-h-5'}>
        <PlateEditor placeholder="No details set" key={JSON.stringify(initialValue)} userData={userData} initialValue={initialValue} readonly={true} variant="readonly" toolbarClassName="hidden" />
      </div>
    </div>
  )
}

export default DetailsField
