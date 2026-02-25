'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import { ProcedureDocumentStatus, ProcedureFrequency } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string(),
  details: z.custom<Value | string>().optional(),
  detailsJSON: z.custom<Value>().optional(),
  status: z.nativeEnum(ProcedureDocumentStatus, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  approvalRequired: z.boolean(),
  reviewFrequency: z.nativeEnum(ProcedureFrequency, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  procedureKindName: z.string().optional(),
  reviewDue: z.date().optional().nullable(),
  tags: z.array(z.string().optional()),
  programIDs: z.array(z.any()).optional(),
  procedureIDs: z.array(z.any()).optional(),
  riskIDs: z.array(z.any()).optional(),
  internalPolicyIDs: z.array(z.any()).optional(),
  controlIDs: z.array(z.any()).optional(),
  taskIDs: z.array(z.any()).optional(),
  approverID: z.string().optional(),
  delegateID: z.string().optional(),
})

export type CreateProcedureFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateProcedureFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        approvalRequired: true,
        status: ProcedureDocumentStatus.DRAFT,
        reviewFrequency: ProcedureFrequency.YEARLY,
        tags: [],
        procedureKindName: '',
      },
    }),
  }
}

export default useFormSchema
