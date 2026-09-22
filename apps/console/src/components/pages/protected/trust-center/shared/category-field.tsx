'use client'

import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { objectToSnakeCase } from '@/utils/strings'
import type { ObjectTypes } from '@repo/codegen/src/type-names'
import { Label } from '@repo/ui/label'
import { Controller, useFormContext } from 'react-hook-form'

interface CategoryFieldProps {
  objectType: ObjectTypes
  isEditing: boolean
  canCreate: boolean
  clearable?: boolean
}

export const CategoryField = ({ objectType, isEditing, canCreate, clearable = false }: CategoryFieldProps) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<{ category?: string }>()

  const { enumOptions, isLoading } = useGetCustomTypeEnums({
    where: { objectType: objectToSnakeCase(objectType), field: 'kind' },
  })

  const selectedValue = watch('category')
  const isInitialLoad = isLoading && enumOptions.length === 0

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
                allowCreate={canCreate}
                clearable={clearable}
                placeholder={isInitialLoad ? 'Loading...' : 'Select or create category...'}
                searchPlaceholder="Search category..."
                disabled={isInitialLoad}
                onValueChange={field.onChange}
              />
            )}
          />

          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </>
      ) : (
        <div className="mt-1">
          <CustomTypeEnumValue value={selectedValue || ''} options={enumOptions} placeholder={selectedValue || '—'} />
        </div>
      )}
    </div>
  )
}
