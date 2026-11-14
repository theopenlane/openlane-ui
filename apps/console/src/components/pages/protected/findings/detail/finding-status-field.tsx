'use client'

import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { usePersistFormField, type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { InlineEnumStatus } from '../../exposure/detail/inline-enum-status'
import { type FindingFormData } from '../hooks/use-form-schema'

type TFindingStatusFieldProps = {
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

export const FindingStatusField: React.FC<TFindingStatusFieldProps> = ({ isEditing, canEdit, handleUpdateField }) => {
  const { control } = useFormContext<FindingFormData>()
  const persistField = usePersistFormField<FindingFormData>()

  return (
    <Controller
      name="findingStatusName"
      control={control}
      render={({ field }) => (
        <InlineEnumStatus
          objectType="finding"
          value={field.value}
          isEditing={isEditing}
          canEdit={canEdit}
          onSave={(next) => persistField('findingStatusName', next, (options) => handleUpdateField(next ? { findingStatusName: next } : { clearFindingStatusName: true }, options))}
        />
      )}
    />
  )
}
