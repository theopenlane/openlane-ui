'use client'

import React from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ProcedureByIdFragment } from '@repo/codegen/src/schema.ts'
import { EditProcedureMetadataFormData } from '../hooks/use-form-schema'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditProcedureMetadataFormData>
  procedure: ProcedureByIdFragment
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, procedure }) => {
  const plateEditorHelper = usePlateEditor()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="policy" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller
        control={form.control}
        name="details"
        render={({ field }) => <PlateEditor initialValue={procedure?.details as string} onChange={field.onChange} placeholder="Write your procedure description" />}
      />
    </div>
  ) : (
    <div className={`!mt-4 min-h-[20px]`}>{procedure?.details && plateEditorHelper.convertToReadOnly(procedure.details as string)}</div>
  )
}

export default DetailsField
