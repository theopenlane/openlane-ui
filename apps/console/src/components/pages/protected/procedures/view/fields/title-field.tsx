'use client'

import React, { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { FormControl, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { UpdateProcedureInput } from '@repo/codegen/src/schema'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { Separator } from '@repo/ui/separator'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TTitleFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditProcedureMetadataFormData>
  handleUpdate: (val: UpdateProcedureInput) => void
  initialData: string
  editAllowed: boolean
}

const TitleField: React.FC<TTitleFieldProps> = ({ isEditing, form, handleUpdate, initialData, editAllowed }) => {
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && editAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = (value: string) => {
    if (isEditing) return

    if (initialData === value) {
      setInternalEditing(false)
      return
    }

    if (!value.trim()) return

    handleUpdate({ name: value })

    setInternalEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  useEscapeKey(() => {
    if (internalEditing) {
      form.setValue('name', initialData)
      setInternalEditing(false)
    }
  })

  return isEditing || internalEditing ? (
    <div className="w-full">
      <Controller
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="w-full">
            <div className="flex items-center">
              <FormLabel>Title</FormLabel>
              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the policy later.</p>} />
            </div>
            <FormControl>
              <Input {...field} onBlur={() => handleBlur(field.value!)} onKeyDown={handleKeyDown} autoFocus className="w-full" />
            </FormControl>
            {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
          </FormItem>
        )}
      />
    </div>
  ) : (
    <>
      <HoverPencilWrapper showPencil={editAllowed} className={`inline-block ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
        <h1
          onDoubleClick={() => {
            if (editAllowed) handleClick()
          }}
          className="text-3xl font-semibold pr-5"
        >
          {form.getValues('name')}
        </h1>
      </HoverPencilWrapper>
      <Separator separatorClass="bg-divider mt-[24px]" />
    </>
  )
}

export default TitleField
