'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'

interface TitleFieldProps {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate: (val: UpdateControlInput | UpdateSubcontrolInput) => void
}

const TitleField = ({ isEditing, isEditAllowed = true, handleUpdate }: TitleFieldProps) => {
  const { register, getValues } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = () => {
    const refCode = getValues('refCode')
    if (!refCode?.trim()) return
    handleUpdate({ refCode })
    setInternalEditing(false)
  }

  return isEditAllowed && (isEditing || internalEditing) ? (
    <div className="w-full">
      <label htmlFor="refCode" className="block text-sm font-medium text-muted-foreground mb-1">
        Name<span className="text-red-500 ml-1">*</span>
      </label>
      <Input id="refCode" {...register('refCode')} onBlur={handleBlur} autoFocus />
    </div>
  ) : (
    <h1 onClick={handleClick} className="text-3xl font-semibold cursor-pointer">
      {getValues('refCode')}
    </h1>
  )
}

export default TitleField
