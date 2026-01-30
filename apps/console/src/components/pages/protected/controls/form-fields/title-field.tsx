'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

interface TitleFieldProps {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  initialValue: string
  referenceFramework: string | null | undefined
}

const TitleField = ({ isEditing, isEditAllowed = true, handleUpdate, initialValue, referenceFramework }: TitleFieldProps) => {
  const { register, getValues, setValue } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)
  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = () => {
    if (isEditing) return

    const refCode = getValues('refCode')
    if (refCode === initialValue) {
      setInternalEditing(false)
      return
    }

    if (!refCode?.trim()) return

    handleUpdate({ refCode })
    setInternalEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  useEscapeKey(() => {
    if (internalEditing) {
      setValue('refCode', initialValue)
      setInternalEditing(false)
    }
  })

  return isEditAllowed && (isEditing || internalEditing) ? (
    <div className="w-full">
      <label htmlFor="refCode" className="block text-sm font-medium text-muted-foreground mb-1">
        Name<span className="text-red-500 ml-1">*</span>
      </label>
      <Input id="refCode" {...register('refCode')} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus />
    </div>
  ) : (
    <div className="flex gap-2 items-center">
      {referenceFramework && <StandardsIconMapper height={40} width={42} shortName={referenceFramework} />}
      <HoverPencilWrapper showPencil={isEditAllowed} onPencilClick={handleClick}>
        <h1 onDoubleClick={handleClick} className={`text-3xl font-semibold pr-5 ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
          {getValues('title')}
        </h1>
      </HoverPencilWrapper>
    </div>
  )
}

export default TitleField
