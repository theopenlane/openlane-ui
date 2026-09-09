'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@theopenlane/ui/input'
import { Label } from '@theopenlane/ui/label'

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
          {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('name') || '—'}</p>
      )}
    </div>
  )
}
