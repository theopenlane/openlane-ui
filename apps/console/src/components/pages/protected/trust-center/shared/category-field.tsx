'use client'

import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { Label } from '@repo/ui/label'
import { Controller, useFormContext } from 'react-hook-form'

interface CategoryFieldProps {
  objectType: string
  isEditing: boolean
  canCreate?: boolean
}

export const CategoryField = ({ objectType, isEditing, canCreate = false }: CategoryFieldProps) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const {
    enumOptions: options,
    onCreateOption,
    isLoading,
  } = useCreatableEnumOptions({
    objectType,
    field: 'kind',
    isEditAllowed: canCreate,
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
                options={options}
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
          <CustomTypeEnumValue value={selectedValue || ''} options={options} placeholder="—" />
        </div>
      )}
    </div>
  )
}
