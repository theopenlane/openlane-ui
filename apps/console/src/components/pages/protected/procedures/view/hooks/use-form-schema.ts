'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from '@udecode/plate-common'
import { ProcedureDocumentStatus, ProcedureFrequency } from '@repo/codegen/src/schema.ts'

const formSchema = z.object({
  name: z.string(),
  details: z.custom<Value | string>().optional(),
  status: z
    .nativeEnum(ProcedureDocumentStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(ProcedureDocumentStatus.DRAFT),
  approvalRequired: z.boolean(),
  reviewFrequency: z
    .nativeEnum(ProcedureFrequency, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .default(ProcedureFrequency.YEARLY),
  procedureType: z.string(),
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

export type EditProcedureMetadataFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditProcedureMetadataFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        approvalRequired: true,
        status: ProcedureDocumentStatus.DRAFT,
        reviewFrequency: ProcedureFrequency.YEARLY,
        tags: [],
        procedureType: '',
      },
    }),
  }
}

export default useFormSchema
