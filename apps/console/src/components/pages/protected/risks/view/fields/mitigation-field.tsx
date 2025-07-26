'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'

type TMitigationFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditAllowed?: boolean
}

const MitigationField: React.FC<TMitigationFieldProps> = ({ isEditing, form, risk, isEditAllowed = true }) => {
  const plateEditorHelper = usePlateEditor()
  const { control } = form

  const shouldEdit = isEditing && isEditAllowed

  return shouldEdit ? (
    <div className="w-full">
      <label htmlFor="mitigation" className="block text-sm font-medium text-muted-foreground mb-1">
        Mitigation
      </label>
      <Controller
        control={control}
        name="mitigation"
        render={({ field }) => <PlateEditor initialValue={field.value as string} onChange={field.onChange} placeholder="Write your mitigation description" />}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="mitigation" className="block text-lg font-medium text-muted-foreground mb-1">
        Mitigation
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto">{risk?.mitigation && plateEditorHelper.convertToReadOnly(risk.mitigation as string)}</div>
    </Card>
  )
}

export default MitigationField
