'use client'
import { useFormContext } from 'react-hook-form'
import { Label } from '@theopenlane/ui/label'
import { Textarea } from '@theopenlane/ui/textarea'
import { FormMessage } from '@theopenlane/ui/form'

export const DescriptionField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Description</Label>
      <Textarea placeholder="Enter description of custom framework" rows={4} {...register('description')} />
      <FormMessage error={errors.description} />
    </div>
  )
}
