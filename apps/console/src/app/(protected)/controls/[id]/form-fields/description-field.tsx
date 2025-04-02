'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import PlateEditor from '@/components/shared/plate/plate-editor'

interface DescriptionFieldProps {
  isEditing: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing }) => {
  const { control, getValues } = useFormContext()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller control={control} name="description" render={({ field }) => <PlateEditor id="description" value={field.value as Value} onChange={field.onChange} variant="basic" />} />
    </div>
  ) : (
    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{JSON.stringify(getValues('description'), null, 2)}</p>
  )
}

export default DescriptionField
