'use client'
import { z } from 'zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { addDays } from 'date-fns'
import { EvidenceEvidenceStatus, EvidenceFrequency } from '@repo/codegen/src/schema.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'
import type { TUploadedFile } from '../upload/types/TUploadedFile'

const commonFields = {
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  creationDate: z
    .date()
    .default(() => new Date())
    .optional()
    .nullable(),
  evidenceFiles: z.array(z.custom<TUploadedFile>()).optional(),
  url: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
  collectionProcedure: z.custom<Value | string>().nullable().optional(),
  source: z.string().optional(),
  fileIDs: z.array(z.string()).optional(),
  controlObjectiveIDs: z.array(z.string()).optional().nullable(),
  subcontrolIDs: z.array(z.string()).optional().nullable(),
  programIDs: z.array(z.string()).optional().nullable(),
  controlIDs: z.array(z.string()).optional().nullable(),
  taskIDs: z.array(z.string()).optional().nullable(),
  evidenceIDs: z.array(z.string()).optional().nullable(),
  groupIDs: z.array(z.string()).optional().nullable(),
  internalPolicyIDs: z.array(z.string()).optional().nullable(),
  procedureIDs: z.array(z.string()).optional().nullable(),
  riskIDs: z.array(z.string()).optional().nullable(),
  status: z.nativeEnum(EvidenceEvidenceStatus).optional() as z.ZodType<EvidenceEvidenceStatus | null | undefined>,
  reviewFrequency: z.nativeEnum(EvidenceFrequency).optional() as z.ZodType<EvidenceFrequency | null | undefined>,
  externalUUID: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  environmentName: z.string().optional().nullable(),
}

const createFormSchema = z.object({
  ...commonFields,
  renewalDate: z.date().min(new Date(), { message: 'Renewal date must be in the future' }).optional().nullable(),
})

const editFormSchema = z.object({
  ...commonFields,
  renewalDate: z.date().optional().nullable(),
})

export type CreateEvidenceFormInput = z.input<typeof createFormSchema>
export type CreateEvidenceFormData = z.output<typeof createFormSchema>
export type EditEvidenceFormData = z.infer<typeof editFormSchema>
export type CreateEvidenceFormMethods = UseFormReturn<CreateEvidenceFormInput, undefined, CreateEvidenceFormData>

const useFormSchema = (isEditScreen?: boolean) => {
  const schema = isEditScreen ? editFormSchema : createFormSchema
  return {
    form: useForm<CreateEvidenceFormInput, undefined, CreateEvidenceFormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: '',
        description: '',
        creationDate: new Date(),
        tags: [],
        evidenceFiles: [],
        source: '',
        fileIDs: [],
        externalUUID: '',
        scopeName: '',
        environmentName: '',
        ...(isEditScreen ? {} : { renewalDate: addDays(new Date(), 365), reviewFrequency: EvidenceFrequency.YEARLY }),
      },
    }),
  }
}

export default useFormSchema
