'use client'
import { z } from 'zod'
import { useForm, UseFormReturn } from 'react-hook-form'
import { addDays } from 'date-fns'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import type { TUploadedFile } from '../upload/types/TUploadedFile'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  creationDate: z.date().default(() => new Date()),
  renewalDate: z.date().min(new Date(), { message: 'Renewal date must be in the future' }).optional().nullable(),
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
  status: z
    .nativeEnum(EvidenceEvidenceStatus, {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .optional()
    .nullable(),
})

export type CreateEvidenceFormInput = z.input<typeof formSchema>
export type CreateEvidenceFormData = z.output<typeof formSchema>
export type EditEvidenceFormData = CreateEvidenceFormData
export type CreateEvidenceFormMethods = UseFormReturn<CreateEvidenceFormInput, undefined, CreateEvidenceFormData>

const useFormSchema = () => {
  const form = useForm<CreateEvidenceFormInput, undefined, CreateEvidenceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      creationDate: new Date(),
      tags: [],
      evidenceFiles: [],
      source: '',
      fileIDs: [],
      renewalDate: addDays(new Date(), 365),
    },
  })

  return {
    form,
  }
}

export default useFormSchema
