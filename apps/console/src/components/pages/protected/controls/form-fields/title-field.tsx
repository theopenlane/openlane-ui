'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface TitleFieldProps {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate: (val: UpdateControlInput | UpdateSubcontrolInput) => void
  initialValue: string
}

const TitleField = ({ isEditing, isEditAllowed = true, handleUpdate, initialValue }: TitleFieldProps) => {
  const { subcontrolId, id } = useParams<{ subcontrolId?: string; id: string }>()
  const { register, getValues, setValue } = useFormContext()
  const [internalEditing, setInternalEditing] = useState(false)

  const tooltipHref = subcontrolId ? `/controls/${id}/create-subcontrol` : `/controls/create-control?mapControlId=${id}`

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
    <>
      <h1 onDoubleClick={handleClick} className={`text-3xl font-semibold ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
        {getValues('refCode')}
        {isEditing && !isEditAllowed && (
          <SystemTooltip
            disableHoverableContent={false}
            icon={<InfoIcon size={14} className="ml-1 -mt-6 text-destructive" />}
            content={
              <p>
                This control was created via a reference framework and the name is not editable. If you need to edit it, consider{' '}
                <Link className="text-blue-500" href={tooltipHref}>
                  creating a new control
                </Link>{' '}
                and linking it.
              </p>
            }
          />
        )}
      </h1>
    </>
  )
}

export default TitleField
