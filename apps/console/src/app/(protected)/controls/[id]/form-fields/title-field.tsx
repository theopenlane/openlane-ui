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
      <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
        Title<span className="text-red-500 ml-1">*</span>
      </label>
      <Input id="title" {...register('title')} />
    </div>
  ) : (
    <h1 className="text-3xl font-semibold">{getValues('title')}</h1>
  )
}

export default TitleField
