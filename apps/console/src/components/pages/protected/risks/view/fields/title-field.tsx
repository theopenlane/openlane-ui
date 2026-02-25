'use client'

import React, { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { PageHeading } from '@repo/ui/page-heading'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'
import { UpdateRiskInput } from '@repo/codegen/src/schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TTitleFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  form: UseFormReturn<EditRisksFormData>
  initialValue?: string
  handleUpdate?: (val: UpdateRiskInput) => void
}

const TitleField: React.FC<TTitleFieldProps> = ({ isEditing, isEditAllowed = true, form, initialValue, handleUpdate }) => {
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = () => {
    if (isEditing) return

    const newValue = form.getValues('name')?.trim()
    const oldValue = initialValue?.trim()

    if (!newValue || newValue === oldValue) {
      setInternalEditing(false)
      return
    }

    if (handleUpdate) {
      handleUpdate({ name: newValue })
    }

    setInternalEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  useEscapeKey(
    () => {
      if (internalEditing && initialValue) {
        form.setValue('name', initialValue)
        setInternalEditing(false)
      }
    },
    { enabled: internalEditing },
  )

  const isCurrentlyEditing = isEditing || internalEditing

  return isCurrentlyEditing ? (
    <div className="w-full pt-5">
      <Controller
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="w-full">
            <div className="flex items-center">
              <FormLabel>Title</FormLabel>
              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the risk later.</p>} />
            </div>
            <FormControl>
              <Input variant="medium" {...field} className="w-full" onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus />
            </FormControl>
            {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
          </FormItem>
        )}
      />
    </div>
  ) : (
    <HoverPencilWrapper showPencil={isEditAllowed} className={`w-fit pr-5 ${isEditAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`} onPencilClick={isEditAllowed ? handleClick : undefined}>
      <PageHeading className="w-fit grow-0 mb-0" heading={form.getValues('name')} onDoubleClick={isEditAllowed ? handleClick : undefined} />
    </HoverPencilWrapper>
  )
}

export default TitleField
