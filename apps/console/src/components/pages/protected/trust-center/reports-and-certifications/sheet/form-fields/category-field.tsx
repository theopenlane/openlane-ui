'use client'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'

interface Props {
  isEditing: boolean
}

export const CategoryField = ({ isEditing }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext()

  return (
    <div className="flex flex-col gap-2">
      <Label>Category</Label>
      {isEditing ? (
        <>
          <Input placeholder="Category" {...register('category')} />
          {errors.category && <p className="text-red-500 text-sm mt-1">{String(errors.category.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('category') || '—'}</p>
      )}
    </div>
  )
}
