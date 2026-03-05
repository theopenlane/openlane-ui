'use client'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const numericField = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return undefined
  return Number(val)
}, z.number().optional())

const formSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  score: numericField,
  numericSeverity: numericField,
  exploitability: numericField,
  impact: numericField,
  remediationSLA: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().int().optional()),
  vector: z.string().optional(),
  open: z.boolean().optional(),
  production: z.boolean().optional(),
  public: z.boolean().optional(),
  validated: z.boolean().optional(),
  blocksProduction: z.boolean().optional(),
  externalID: z.string().optional(),
  externalOwnerID: z.string().optional(),
  externalURI: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  source: z.string().optional(),
  findingClass: z.string().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export const bulkEditFieldSchema = z.object({
  severity: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  open: z.boolean().optional(),
  production: z.boolean().optional(),
  validated: z.boolean().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
})

export type FindingFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<FindingFormData>({
      resolver: zodResolver(formSchema) as Resolver<FindingFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema
