'use client'

import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import { useUpdateControl } from '@/lib/graphql-hooks/controls'
import { useParams } from 'next/navigation'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string | Value
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue }) => {
  const { id } = useParams<{ id: string }>()
  const { control } = useFormContext()
  const plateEditorHelper = usePlateEditor()
  const [internalEditing, setInternalEditing] = useState(false)
  const [localValue, setLocalValue] = useState(initialValue)
  const { mutateAsync: updateControl } = useUpdateControl()

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  const handleBlur = async () => {
    const description = await plateEditorHelper.convertToHtml(localValue as Value)

    await updateControl({
      updateControlId: id,
      input: {
        description,
      },
    })
    setInternalEditing(false)
  }

  return isEditing || internalEditing ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Description
      </label>
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <PlateEditor
            initialValue={field.value}
            onChange={(val) => {
              setLocalValue(val)
              field.onChange(val)
            }}
            onBlur={handleBlur}
            variant="basic"
            placeholder="Write your control description"
          />
        )}
      />
    </div>
  ) : (
    <div onClick={handleClick} className="cursor-pointer min-h-[20px]">
      {plateEditorHelper.convertToReadOnly(initialValue as string)}
    </div>
  )
}

export default DescriptionField
