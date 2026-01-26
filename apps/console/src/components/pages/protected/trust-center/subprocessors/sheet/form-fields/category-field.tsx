'use client'

import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { useFormContext } from 'react-hook-form'

export const CategoryField = ({ isEditing }: { isEditing: boolean }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

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
                <Input placeholder="Enter category (e.g. Data Warehouse, Infrastructure Hosting)" {...field} />
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
