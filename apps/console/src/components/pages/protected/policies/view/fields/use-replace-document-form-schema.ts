'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  file: z.custom<File | undefined>((value) => value instanceof File, { message: 'Please select a Word document' }),
})

export type ReplaceDocumentFormData = z.infer<typeof formSchema>

const useReplaceDocumentFormSchema = () => {
  return {
    form: useForm<ReplaceDocumentFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        file: undefined,
      },
    }),
  }
}

export default useReplaceDocumentFormSchema
