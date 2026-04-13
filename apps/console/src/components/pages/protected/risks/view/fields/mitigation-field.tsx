'use client'

import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import { type Value } from 'platejs'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

type TMitigationFieldProps = {
  isEditing: boolean
  initialValue?: string | Value
  isEditAllowed?: boolean
  isCreate?: boolean
  clearData?: boolean
  onCleared?: () => void
}

const MitigationField: React.FC<TMitigationFieldProps> = ({ isEditing, initialValue, isEditAllowed = true, isCreate, clearData, onCleared }) => {
  const { control } = useFormContext()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  const label = (
    <label htmlFor="mitigation" className="block text-lg my-1">
      <div className="flex items-center">
        <span className="mr-1 font-semibold">Mitigation</span>
        <SystemTooltip
          icon={<InfoIcon size={14} className="text-muted-foreground" />}
          content="The actions or strategies implemented to reduce the impact or likelihood of this risk. Effective mitigation helps minimize potential losses and ensures business continuity."
        />
      </div>
    </label>
  )

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      {label}
      <Controller
        control={control}
        name="mitigation"
        render={({ field }) => (
          <PlateEditor
            userData={userData}
            clearData={clearData}
            initialValue={initialValue}
            onClear={() => onCleared?.()}
            onChange={(val) => {
              field.onChange(val)
            }}
            isCreate={isCreate}
            placeholder="Write the actions or strategies implemented to reduce the impact or likelihood of this risk"
          />
        )}
      />
    </div>
  ) : (
    <div className="w-full">
      {label}
      <div className={'min-h-5'}>
        <PlateEditor placeholder="No mitigation set" key={JSON.stringify(initialValue)} userData={userData} initialValue={initialValue} readonly={true} variant="readonly" toolbarClassName="hidden" />
      </div>
    </div>
  )
}

export default MitigationField
