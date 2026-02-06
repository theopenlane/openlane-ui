'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { Value } from 'platejs'

const formSchema = z.object({
  taskKindName: z
    .string({
      errorMap: () => ({ message: 'Invalid category' }),
    })
    .default('Evidence'),
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters',
  }),
  details: z.custom<Value | string>().optional(),
  assigneeID: z.string().optional().nullable(),
  due: z.any(),
  tags: z.array(z.string()).optional(),
  status: z
    .nativeEnum(TaskTaskStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(TaskTaskStatus.OPEN),
})

export type CreateTaskFormData = z.infer<typeof formSchema>
export type EditTaskFormData = z.infer<typeof formSchema>

const useFormSchema = (defaultValues?: Partial<CreateTaskFormData>) => {
  return {
    form: useForm<CreateTaskFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        tags: [],
        ...defaultValues,
      },
    }),
  }
}

export default useFormSchema
