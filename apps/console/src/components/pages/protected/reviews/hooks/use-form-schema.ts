'use client'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  details: z.custom<Value | string>().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  classification: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
  reporter: z.string().optional(),
  approved: z.boolean().optional(),
  approvedAt: z.union([z.string(), z.date()]).optional().nullable(),
  reportedAt: z.union([z.string(), z.date()]).optional().nullable(),
  reviewedAt: z.union([z.string(), z.date()]).optional().nullable(),
  externalID: z.string().optional(),
  externalOwnerID: z.string().optional(),
  externalURI: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  controlIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
  remediationIDs: z.array(z.string()).optional(),
  entityIDs: z.array(z.string()).optional(),
  taskIDs: z.array(z.string()).optional(),
  assetIDs: z.array(z.string()).optional(),
  programIDs: z.array(z.string()).optional(),
  riskIDs: z.array(z.string()).optional(),
})

export const bulkEditFieldSchema = z.object({
  state: z.string().optional(),
  category: z.string().optional(),
  classification: z.string().optional(),
  source: z.string().optional(),
  approved: z.boolean().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  reviewedAt: z.date().optional().nullable(),
  approvedAt: z.date().optional().nullable(),
  reportedAt: z.date().optional().nullable(),
})

export type ReviewFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<ReviewFormData>({
      resolver: zodResolver(formSchema) as Resolver<ReviewFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema
