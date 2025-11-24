'use client'

import { Controller, UseFormReturn } from 'react-hook-form'
import PlateEditor from '@/components/shared/plate/plate-editor'
import React from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { EditRisksFormData } from '@/components/pages/protected/risks/view/hooks/use-form-schema'

type TDetailsFieldProps = {
  isEditing: boolean
  form: UseFormReturn<EditRisksFormData>
  risk?: RiskFieldsFragment
  isEditAllowed?: boolean
  clearData?: boolean
  onCleared?: () => void
}

const DetailsField: React.FC<TDetailsFieldProps> = ({ isEditing, form, risk, isEditAllowed = true, clearData, onCleared }) => {
  const plateEditorHelper = usePlateEditor()
  const { control } = form

  return isEditAllowed && isEditing ? (
    <div className="w-full">
      <label htmlFor="risk" className="block text-sm font-medium text-muted-foreground mb-1">
        Details
      </label>
      <Controller
        control={control}
        name="details"
        render={({ field }) => (
          <PlateEditor initialValue={field.value as string} clearData={clearData} onClear={() => onCleared?.()} onChange={field.onChange} placeholder="Write your risk description" />
        )}
      />
    </div>
  ) : (
    <Card className="p-4">
      <label htmlFor="risk" className="block text-lg font-medium text-muted-foreground mb-1">
        Details
      </label>
      <div className="!mt-4 bg-none max-h-[55vh] overflow-auto">{risk?.details && plateEditorHelper.convertToReadOnly(risk.details as string)}</div>
    </Card>
  )
}

export default DetailsField
