'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { addDays } from 'date-fns'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  creationDate: z.date().default(new Date()),
  renewalDate: z.date().min(new Date(), { message: 'Renewal date must be in the future' }).optional().nullable(),
  evidenceFiles: z.array(z.any()).optional(),
  url: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  collectionProcedure: z.custom<Value | string>().nullable().optional(),
  source: z.string().optional(),
  fileIDs: z.array(z.string()).optional(),
  controlObjectiveIDs: z.array(z.any()).optional().nullable(),
  subcontrolIDs: z.array(z.any()).optional().nullable(),
  programIDs: z.array(z.any()).optional().nullable(),
  controlIDs: z.array(z.any()).optional().nullable(),
  taskIDs: z.array(z.any()).optional().nullable(),
  evidenceIDs: z.array(z.any()).optional().nullable(),
  groupIDs: z.array(z.any()).optional().nullable(),
  internalPolicyIDs: z.array(z.any()).optional().nullable(),
  procedureIDs: z.array(z.any()).optional().nullable(),
  riskIDs: z.array(z.any()).optional().nullable(),
  status: z
    .nativeEnum(EvidenceEvidenceStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .optional()
    .nullable(),
})

export type CreateEvidenceFormData = z.infer<typeof formSchema>
export type EditEvidenceFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateEvidenceFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        description: '',
        tags: [],
        evidenceFiles: [],
        source: '',
        fileIDs: [],
        renewalDate: addDays(new Date(), 365),
      },
    }),
  }
}

export default useFormSchema
