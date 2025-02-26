import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  description: z.string().min(2, {
    message: 'Description must be at least 2 characters',
  }),
  tags: z.array(z.string().optional()),
  creationDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).default(new Date()),
  renewalDate: z.date().min(new Date(), { message: 'End date must be after start date' }).default(addDays(new Date(), 365)),
  evidenceFiles: z.array(z.any()).optional(),
})

export type CreateEvidenceFormData = z.infer<typeof formSchema>
export type CreateEvidenceFormGrouped = {
  input: Omit<CreateEvidenceFormData, 'evidenceFiles'>
  evidenceFiles: Pick<CreateEvidenceFormData, 'evidenceFiles'>
}

const useFormSchema = () => {
  return {
    form: useForm<CreateEvidenceFormData>({
      resolver: zodResolver(formSchema),
    }),
  }
}

export default useFormSchema
