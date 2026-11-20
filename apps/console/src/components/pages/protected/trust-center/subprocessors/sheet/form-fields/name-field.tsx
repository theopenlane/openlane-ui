'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { FormMessage } from '@repo/ui/form'

interface Props {
  isEditing: boolean
}

export const NameField = ({ isEditing }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext()

  return (
    <div>
      <Label>Name</Label>

      {isEditing ? (
        <>
          <Input placeholder="Subprocessor name" {...register('name')} />
          <FormMessage error={errors.name} />
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('name') || '—'}</p>
      )}
    </div>
  )
}
