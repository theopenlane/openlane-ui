'use client'

import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { Value } from 'platejs'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string | Value
  handleUpdate: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  isEditAllowed?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue, handleUpdate, isEditAllowed = true }) => {
  const { control, getValues } = useFormContext()
  const plateEditorHelper = usePlateEditor()
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  const handleBlur = async () => {
    if (isEditing) {
      return
    }
    const fieldValue = getValues('description')
    const description = await plateEditorHelper.convertToHtml(fieldValue as Value)
    if (description === initialValue) {
      setInternalEditing(false)
      return
    }
    handleUpdate({
      description,
    })
    setInternalEditing(false)
  }

  return isEditAllowed && (isEditing || internalEditing) ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Description
      </label>
      <Controller
        control={control}
        name="description"
        render={({ field }) => <PlateEditor initialValue={field.value} onChange={field.onChange} onBlur={handleBlur} placeholder="Write your control description" />}
      />
    </div>
  ) : (
    <div onClick={handleClick} className="cursor-pointer min-h-[20px]">
      {plateEditorHelper.convertToReadOnly(initialValue as string)}
    </div>
  )
}

export default DescriptionField
