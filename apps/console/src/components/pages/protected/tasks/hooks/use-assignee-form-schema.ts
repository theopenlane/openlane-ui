'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  assigneeID: z.string().optional().nullable(),
})

export type EditTaskAssigneeFormData = z.infer<typeof formSchema>

const useAssigneeFormSchema = () => {
  return {
    form: useForm<EditTaskAssigneeFormData>({
      resolver: zodResolver(formSchema),
    }),
  }
}

export default useAssigneeFormSchema
