'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@theopenlane/ui/label'
import { Textarea } from '@theopenlane/ui/textarea'
import { FormMessage } from '@theopenlane/ui/form'

interface Props {
  isEditing: boolean
}

export const DescriptionField = ({ isEditing }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext()

  return (
    <div>
      <Label>Description</Label>

      {isEditing ? (
        <>
          <Textarea placeholder="Short description" {...register('description')} />
          <FormMessage error={errors.description} />
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('description') || '—'}</p>
      )}
    </div>
  )
}
