'use client'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import CustomTypeEnumChip from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

interface Props {
  isEditing: boolean
}

export const CategoryField = ({ isEditing }: Props) => {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext()

  const { enumOptions, isLoading } = useGetCustomTypeEnums({
    where: {
      objectType: 'trustcenterdoc',
      field: 'kind',
    },
  })

  return (
    <div className="flex flex-col gap-2">
      <Label>Category</Label>
      {isEditing ? (
        <>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? 'Loading...' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {enumOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <CustomTypeEnumChip option={option} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('category') || '—'}</p>
      )}
    </div>
  )
}
