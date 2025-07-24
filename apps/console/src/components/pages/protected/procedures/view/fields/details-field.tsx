'use client'

import React, { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ProcedureByIdFragment, UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { Value } from 'platejs'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'
import useEscapeKey from '@/hooks/useEscapeKey'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
  editAllowed?: boolean
  handleUpdate: (val: UpdateProcedureInput) => void
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, procedure, editAllowed = true, handleUpdate }) => {
  const plateEditorHelper = usePlateEditor()
  const [internalEditing, setInternalEditing] = useState(false)

  const handleClick = () => {
    if (!isEditing && editAllowed) {
      setInternalEditing(true)
    }
  }

  const handleBlur = async () => {
    if (isEditing) return

    const value = form.getValues('details')
    const html = await plateEditorHelper.convertToHtml(value as Value)

    handleUpdate({ details: html })
    setInternalEditing(false)
  }

  useEscapeKey(() => {
    if (internalEditing) {
      form.setValue('details', procedure?.details as string)
      setInternalEditing(false)
    }
  })

  return isEditing || internalEditing ? (
    <div className="w-full">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller
        control={form.control}
        name="details"
        render={({ field }) => <PlateEditor initialValue={procedure?.details as string} onChange={field.onChange} onBlur={handleBlur} placeholder="Write your procedure description" />}
      />
    </div>
  ) : (
    <div onClick={handleClick} className={`!mt-4 min-h-[20px] ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
      {procedure?.details && plateEditorHelper.convertToReadOnly(procedure.details as string)}
    </div>
  )
}

export default DetailsField
