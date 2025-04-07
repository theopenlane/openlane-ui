'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

interface DescriptionFieldProps {
  isEditing: boolean
  initialValue: string
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue }) => {
  const { control, getValues } = useFormContext()
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Description
      </label>
      <Controller control={control} name="description" render={({ field }) => <PlateEditor initialValue={field.value} onChange={field.onChange} variant="basic" />} />
    </div>
  ) : (
    <div>{plateEditorHelper.convertToReadOnly(initialValue)}</div>
  )
}

export default DescriptionField
