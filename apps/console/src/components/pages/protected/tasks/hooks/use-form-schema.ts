'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { Value } from 'platejs'

const formSchema = z.object({
  category: z
    .enum(TaskTypes, {
      error: () => ({ message: 'Invalid status' }),
    })
    .default(TaskTypes.EVIDENCE),
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters',
  }),
  details: z.custom<Value | string>().optional(),
  assigneeID: z.string().optional().nullable(),
  due: z.any(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum(TaskTaskStatus, {
      error: () => ({ message: 'Invalid status' }),
    })
    .default(TaskTaskStatus.OPEN),
})

export type CreateTaskFormData = z.infer<typeof formSchema>
export type EditTaskFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateTaskFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        tags: [],
      },
    }),
  }
}

export default useFormSchema
