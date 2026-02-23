'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string(),
  details: z.custom<Value | string>().optional(),
  detailsJSON: z.custom<Value>().optional(),
  status: z.nativeEnum(InternalPolicyDocumentStatus, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  approvalRequired: z.boolean(),
  reviewFrequency: z.nativeEnum(InternalPolicyFrequency, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  internalPolicyKindName: z.string(),
  reviewDue: z.date().optional().nullable(),
  tags: z.array(z.string().optional()),
  programIDs: z.array(z.any()).optional(),
  procedureIDs: z.array(z.any()).optional(),
  controlObjectiveIDs: z.array(z.any()).optional(),
  controlIDs: z.array(z.any()).optional(),
  taskIDs: z.array(z.any()).optional(),
  approverID: z.string().optional(),
  delegateID: z.string().optional(),
})

export type EditPolicyMetadataFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditPolicyMetadataFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        approvalRequired: true,
        status: InternalPolicyDocumentStatus.DRAFT,
        reviewFrequency: InternalPolicyFrequency.YEARLY,
        tags: [],
        internalPolicyKindName: '',
      },
    }),
  }
}

export default useFormSchema
