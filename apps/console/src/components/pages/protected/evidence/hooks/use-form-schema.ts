import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'

const useFormSchema = () => {
  const today = new Date()
  const oneYearFromToday = addDays(new Date(), 365)

  const formSchema = z.object({
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters',
    }),
    description: z.string().min(2, {
      message: 'Description must be at least 2 characters',
    }),
    tags: z.array(z.string().optional()),
    creationDate: z.date().min(new Date(), { message: 'Start date must be in the future' }).default(today),
    renewalDate: z.date().min(new Date(), { message: 'End date must be after start date' }).default(oneYearFromToday),
  })

  return {
    form: useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
    }),
  }
}

export default useFormSchema
