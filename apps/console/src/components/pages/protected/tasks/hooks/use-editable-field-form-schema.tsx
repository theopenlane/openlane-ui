'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  id: z.string().optional().nullable(),
})

export type EditableFieldFormData = z.infer<typeof formSchema>

const useEditableFieldFormSchema = () => {
  return {
    form: useForm<EditableFieldFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: { id: null },
    }),
  }
}

export default useEditableFieldFormSchema
