'use client'
import { z } from 'zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { type Value } from 'platejs'

const buildFormSchema = (requireTaskKind: boolean) =>
  z.object({
    taskKindName: z
      .string()
      .optional()
      .refine((value) => !requireTaskKind || !!value, { error: 'Invalid category' }),
    title: z.string().min(2, {
      message: 'Title must be at least 2 characters',
    }),
    details: z.custom<Value | string>().optional(),
    assigneeID: z.string().optional().nullable(),
    due: z.union([z.date(), z.string()]).nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(TaskTaskStatus, {
      error: 'Invalid status',
    }),
    isTemplate: z.boolean(),
  })

export type CreateTaskFormData = z.infer<ReturnType<typeof buildFormSchema>>
export type EditTaskFormData = CreateTaskFormData

const useFormSchema = (defaultValues?: Partial<CreateTaskFormData>, { isCreate = true }: { isCreate?: boolean } = {}) => {
  const schema = useMemo(() => buildFormSchema(isCreate), [isCreate])
  return {
    form: useForm<CreateTaskFormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        taskKindName: 'Uncategorized',
        title: '',
        tags: [],
        status: TaskTaskStatus.OPEN,
        isTemplate: false,
        ...defaultValues,
      },
    }),
  }
}

export default useFormSchema
