'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'

interface TitleFieldProps {
  isEditing: boolean
}

const TitleField: React.FC<TitleFieldProps> = ({ isEditing }) => {
  const { register, getValues } = useFormContext()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="refCode" className="block text-sm font-medium text-muted-foreground mb-1">
        Name<span className="text-red-500 ml-1">*</span>
      </label>
      <Input id="refCode" {...register('refCode')} />
    </div>
  ) : (
    <h1 className="text-3xl font-semibold">{getValues('refCode')}</h1>
  )
}

export default TitleField
