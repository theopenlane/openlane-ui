'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'
import { useParams } from 'next/navigation'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string | Value
  isEditAllowed?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue, isEditAllowed }) => {
  const { subcontrolId } = useParams<{ subcontrolId: string | undefined; id: string }>()
  const { control } = useFormContext()
  const plateEditorHelper = usePlateEditor()

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
        name="description"
        render={({ field }) => (
          <PlateEditor
            initialValue={field.value}
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
      <div className={'min-h-[20px]'}>{plateEditorHelper.convertToReadOnly(initialValue as string)}</div>
    </div>
  )
}

export default DescriptionField
