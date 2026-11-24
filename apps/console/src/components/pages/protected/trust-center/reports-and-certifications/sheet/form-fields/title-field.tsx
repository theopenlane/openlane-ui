'use client'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { FormMessage } from '@repo/ui/form'

interface Props {
  isEditing: boolean
}

export const TitleField = ({ isEditing }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext()

  return (
    <div className="flex flex-col gap-2">
      <Label>Title</Label>
      {isEditing ? (
        <>
          <Input placeholder="Document title" {...register('title')} />
          <FormMessage error={errors.title} />
        </>
      ) : (
        <p className="text-base text-muted-foreground mt-1">{watch('title') || '—'}</p>
      )}
    </div>
  )
}
