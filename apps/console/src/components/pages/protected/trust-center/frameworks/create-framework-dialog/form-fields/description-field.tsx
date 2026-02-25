'use client'
import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'

export const DescriptionField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Description</Label>
      <Textarea placeholder="Enter description of custom framework" rows={4} {...register('description')} />
      {errors.description && <p className="text-red-500 text-sm mt-1">{String(errors.description.message)}</p>}
    </div>
  )
}
