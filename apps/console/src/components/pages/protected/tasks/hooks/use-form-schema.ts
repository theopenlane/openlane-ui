'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'

const formSchema = z.object({
  category: z
    .nativeEnum(TaskTypes, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(TaskTypes.EVIDENCE),
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters',
  }),
  description: z.string().optional(),
  assigneeID: z.string().optional(),
  due: z.date(),
})

export type CreateTaskFormData = z.infer<typeof formSchema>
export type EditTaskFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateTaskFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        description: '',
      },
    }),
  }
}

export default useFormSchema
