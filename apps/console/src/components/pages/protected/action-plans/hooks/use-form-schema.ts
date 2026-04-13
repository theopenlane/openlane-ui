'use client'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ActionPlanDocumentStatus, ActionPlanPriority, ActionPlanFrequency } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  source: z.string().optional(),
  status: z.nativeEnum(ActionPlanDocumentStatus).optional().nullable(),
  priority: z.nativeEnum(ActionPlanPriority).optional().nullable(),
  reviewFrequency: z.nativeEnum(ActionPlanFrequency).optional().nullable(),
  dueDate: z.union([z.string(), z.date()]).optional().nullable(),
  reviewDue: z.union([z.string(), z.date()]).optional().nullable(),
})

export const bulkEditFieldSchema = z.object({
  status: z.nativeEnum(ActionPlanDocumentStatus).optional().nullable(),
  priority: z.nativeEnum(ActionPlanPriority).optional().nullable(),
})

export type ActionPlanFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<ActionPlanFormData>({
      resolver: zodResolver(formSchema) as Resolver<ActionPlanFormData>,
      defaultValues: {
        name: '',
        title: '',
        status: ActionPlanDocumentStatus.DRAFT,
        priority: ActionPlanPriority.MEDIUM,
      },
    }),
  }
}

export default useFormSchema
