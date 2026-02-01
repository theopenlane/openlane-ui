'use client'

import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useFormContext } from 'react-hook-form'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

export const CategoryField = ({ isEditing }: { isEditing: boolean }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const { enumOptions, isLoading } = useGetCustomTypeEnums({
    where: {
      objectType: 'trustcentersubprocessor',
      field: 'kind',
    },
  })

  return (
    <FormField
      control={control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>

          {isEditing ? (
            <>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? 'Loading...' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {enumOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
            </>
          ) : (
            <div className="mt-2 text-base text-muted-foreground">{field.value?.trim() || '—'}</div>
          )}
        </FormItem>
      )}
    />
  )
}
