'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { TaskTaskStatus } from '@repo/codegen/src/schema'

const formSchema = z.object({
  category: z
    .nativeEnum(TaskTypes, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(TaskTypes.EVIDENCE),
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters',
  }),
  details: z.string().optional(),
  assigneeID: z.string().optional(),
  due: z.date().optional(),
  taskObjects: z.array(z.any()).optional(),
  controlObjectiveIDs: z.array(z.any()).optional(),
  subcontrolIDs: z.array(z.any()).optional(),
  programIDs: z.array(z.any()).optional(),
  procedureIDs: z.array(z.any()).optional(),
  internalPolicyIDs: z.array(z.any()).optional(),
  evidenceIDs: z.array(z.any()).optional(),
  groupIDs: z.array(z.any()).optional(),
  status: z
    .nativeEnum(TaskTaskStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
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
        details: '',
        taskObjects: [],
      },
    }),
  }
}

export default useFormSchema
