'use client'
import React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

interface Props {
  isEditing: boolean
  isCreateAllowed?: boolean
}

export const CategoryField = ({ isEditing, isCreateAllowed = false }: Props) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const { enumOptions, onCreateOption, isLoading } = useCreatableEnumOptions({
    objectType: 'trust_center_doc',
    field: 'kind',
    isEditAllowed: isCreateAllowed,
  })

  const selectedValue = watch('category')

  return (
    <div className="flex flex-col gap-2">
      <Label>Category</Label>

      {isEditing ? (
        <>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CreatableCustomTypeEnumSelect
                value={field.value}
                options={enumOptions}
                onCreateOption={onCreateOption}
                placeholder={isLoading ? 'Loading...' : 'Select or create category...'}
                searchPlaceholder="Search category..."
                disabled={isLoading}
                onValueChange={field.onChange}
              />
            )}
          />

          {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
        </>
      ) : (
        <div className="mt-1">
          <CustomTypeEnumValue value={selectedValue || ''} options={enumOptions} placeholder="—" />
        </div>
      )}
    </div>
  )
}
