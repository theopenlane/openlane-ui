'use client'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'

export const TitleField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Title</Label>
      <Input placeholder="Document title" {...register('title')} />
      {errors.title && <p className="text-red-500 text-sm mt-1">{String(errors.title.message)}</p>}
    </div>
  )
}
