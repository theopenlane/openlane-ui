'use client'
import { useFormContext } from 'react-hook-form'
import { Input } from '@theopenlane/ui/input'
import { Label } from '@theopenlane/ui/label'

export const TitleField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Title</Label>
      <Input placeholder="Framework title" {...register('title')} />
      {errors.title && <p className="text-red-500 text-sm mt-1">{String(errors.title.message)}</p>}
    </div>
  )
}
