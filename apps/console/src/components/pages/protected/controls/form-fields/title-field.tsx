'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { type UpdateControlInput, type UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

interface TitleFieldProps {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  initialRefCode: string
  initialTitle: string
  referenceFramework: string | null | undefined
}

const TitleField = ({ isEditing, isEditAllowed = true, handleUpdate, initialRefCode, initialTitle, referenceFramework }: TitleFieldProps) => {
  const { register, getValues, setValue } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(true)
    }
  }

  const handleGroupBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (isEditing) return
    if (e.currentTarget.contains(e.relatedTarget as Node)) return

    const refCode = getValues('refCode')
    const title = getValues('title')

    if (!refCode?.trim()) return

    const updates: Record<string, string | null> = {}
    if (refCode !== initialRefCode) {
      updates.refCode = refCode
    }
    if ((title ?? '') !== (initialTitle ?? '')) {
      updates.title = title || null
    }

    if (Object.keys(updates).length > 0) {
      handleUpdate(updates as UpdateControlInput | UpdateSubcontrolInput)
    }

    setInternalEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  useEscapeKey(() => {
    if (internalEditing) {
      setValue('refCode', initialRefCode)
      setValue('title', initialTitle)
      setInternalEditing(false)
    }
  })

  const refCode = getValues('refCode')
  const title = getValues('title')
  const displayTitle = title ? `${refCode} ${title}` : refCode

  return isEditAllowed && (isEditing || internalEditing) ? (
    <div className="flex gap-4 w-full" onBlur={handleGroupBlur}>
      <div className="flex-1">
        <label htmlFor="refCode" className="block text-sm font-medium text-muted-foreground mb-1">
          Ref Code<span className="text-red-500 ml-1">*</span>
        </label>
        <Input id="refCode" {...register('refCode')} onKeyDown={handleKeyDown} autoFocus={internalEditing} />
      </div>
      <div className="flex-1">
        <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
          Title
        </label>
        <Input id="title" {...register('title')} onKeyDown={handleKeyDown} />
      </div>
    </div>
  ) : (
    <div className="flex gap-2 items-center">
      {referenceFramework && (
        <div className="shrink-0">
          <StandardsIconMapper height={40} width={42} shortName={referenceFramework} />
        </div>
      )}
      <HoverPencilWrapper showPencil={isEditAllowed} onPencilClick={handleClick}>
        <h1 onDoubleClick={handleClick} className={`text-3xl font-semibold pr-5 ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
          {displayTitle}
        </h1>
      </HoverPencilWrapper>
    </div>
  )
}

export default TitleField
