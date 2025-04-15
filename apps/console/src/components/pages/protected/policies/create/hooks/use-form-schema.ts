'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from '@udecode/plate-common'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string(),
  details: z.custom<Value | string>().optional(),
  status: z
    .nativeEnum(InternalPolicyDocumentStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(InternalPolicyDocumentStatus.DRAFT),
  approvalRequired: z.boolean(),
  reviewFrequency: z
    .nativeEnum(InternalPolicyFrequency, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(InternalPolicyFrequency.YEARLY),
  policyType: z.string(),
  reviewDue: z.date().optional().nullable(),
  tags: z.array(z.string().optional()),
  programIDs: z.array(z.any()).optional(),
  procedureIDs: z.array(z.any()).optional(),
  controlObjectiveIDs: z.array(z.any()).optional(),
  controlIDs: z.array(z.any()).optional(),
  taskIDs: z.array(z.any()).optional(),
})

export type CreatePolicyFormData = z.infer<typeof formSchema>
export type EditPolicyFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreatePolicyFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        approvalRequired: true,
        status: InternalPolicyDocumentStatus.DRAFT,
        reviewFrequency: InternalPolicyFrequency.YEARLY,
        tags: [],
        policyType: '',
      },
    }),
  }
}

export default useFormSchema
