'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'

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
          {errors.description && <p className="text-red-500 text-sm mt-1">{String(errors.description.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('description') || '—'}</p>
      )}
    </div>
  )
}
