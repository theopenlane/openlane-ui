'use client'

import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import { type Value } from 'platejs'
import { useSession } from 'next-auth/react'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user.ts'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'

type TBusinessCostFieldProps = {
  isEditing: boolean
  initialValue?: string | Value
  isEditAllowed?: boolean
  isCreate?: boolean
  clearData?: boolean
  onCleared?: () => void
}

const BusinessCostField: React.FC<TBusinessCostFieldProps> = ({ isEditing, initialValue, isEditAllowed = true, isCreate, clearData, onCleared }) => {
  const { control } = useFormContext()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const { data: userData } = useGetCurrentUser(userId)

  const label = (
    <label htmlFor="businessCosts" className="block text-lg my-1">
      <div className="flex items-center">
        <span className="mr-1 font-semibold">Business Costs</span>
        <SystemTooltip
          icon={<InfoIcon size={14} className="text-muted-foreground" />}
          content="The potential business cost associated with this risk if realized—such as revenue loss, remediation expenses, legal fees, or operational disruption. This information helps prioritize risk mitigation efforts and allocate resources effectively."
        />
      </div>
    </label>
  )

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      {label}
      <Controller
        control={control}
        name="businessCosts"
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
            placeholder="Write the potential business costs associated with this risk"
          />
        )}
      />
    </div>
  ) : (
    <div className="w-full">
      {label}
      <div className={'min-h-5'}>
        <PlateEditor
          placeholder="No business costs set"
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

export default BusinessCostField
