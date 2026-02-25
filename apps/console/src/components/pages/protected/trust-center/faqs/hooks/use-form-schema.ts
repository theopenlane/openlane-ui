'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  referenceLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export { formSchema as faqFormSchema }

export type FaqFormValues = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<FaqFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: { question: '', answer: '', referenceLink: '' },
    }),
  }
}

export default useFormSchema
