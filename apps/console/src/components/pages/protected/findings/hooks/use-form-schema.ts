'use client'

import { responsibilityFieldSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Value } from 'platejs'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'

const numericField = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return undefined
  return Number(val)
}, z.number().optional())

const formSchema = z.object({
  internalOwner: responsibilityFieldSchema,
  assignedTo: responsibilityFieldSchema,
  reviewedBy: responsibilityFieldSchema,
  displayName: z.string().optional(),
  description: z.custom<Value | string>().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  findingStatusName: z.string().optional().nullable(),
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
  externalURI: z.url('Please enter a valid URL').optional().or(z.literal('')),
  source: z.string().optional(),
  findingClass: z.string().optional(),
  environmentName: z.string().optional().nullable(),
  scopeName: z.string().optional().nullable(),
  stepsToReproduce: z.array(z.string()).optional(),
  recommendedActions: z.string().optional(),
  references: z.array(z.string()).optional(),
  controlIDs: z.array(z.string()).optional(),
  subcontrolIDs: z.array(z.string()).optional(),
  riskIDs: z.array(z.string()).optional(),
  programIDs: z.array(z.string()).optional(),
  taskIDs: z.array(z.string()).optional(),
  assetIDs: z.array(z.string()).optional(),
  scanIDs: z.array(z.string()).optional(),
  remediationIDs: z.array(z.string()).optional(),
  reviewIDs: z.array(z.string()).optional(),
  vulnerabilityIDs: z.array(z.string()).optional(),
})

export const bulkEditFieldSchema = z.object({
  internalOwner: responsibilityFieldSchema,
  severity: z.string().optional(),
  findingStatusName: z.string().optional().nullable(),
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
