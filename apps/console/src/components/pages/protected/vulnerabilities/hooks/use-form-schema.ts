'use client'
import { z } from 'zod'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'

const formSchema = z.object({
  displayName: z.string().optional(),
  externalID: z.string().min(1, 'External ID is required'),
  description: z.custom<Value | string>().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  cveID: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  score: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().optional()),
  exploitability: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().optional()),
  impact: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().optional()),
  remediationSLA: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    return Number(val)
  }, z.number().int().optional()),
  source: z.string().optional(),
  externalOwnerID: z.string().optional(),
  externalURI: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  vector: z.string().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  blocking: z.boolean().optional(),
  open: z.boolean().optional(),
  production: z.boolean().optional(),
  public: z.boolean().optional(),
  validated: z.boolean().optional(),
})

export const bulkEditFieldSchema = z.object({
  severity: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  blocking: z.boolean().optional(),
  open: z.boolean().optional(),
  production: z.boolean().optional(),
  validated: z.boolean().optional(),
})

export type VulnerabilityFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<VulnerabilityFormData>({
      resolver: zodResolver(formSchema) as Resolver<VulnerabilityFormData>,
      defaultValues: {},
    }),
  }
}

export default useFormSchema
