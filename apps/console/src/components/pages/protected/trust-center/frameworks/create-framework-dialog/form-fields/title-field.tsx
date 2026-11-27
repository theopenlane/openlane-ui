'use client'
import { useFormContext } from 'react-hook-form'
import { Input } from '@theopenlane/ui/input'
import { Label } from '@theopenlane/ui/label'
import { FormMessage } from '@theopenlane/ui/form'

export const TitleField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  return (
    <div>
      <Label>Title</Label>
      <Input placeholder="Framework title" {...register('title')} />
      <FormMessage error={errors.title} />
    </div>
  )
}
