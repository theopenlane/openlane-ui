'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Value } from 'platejs'
import { EntityEntityStatus } from '@repo/codegen/src/schema'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().optional(),
  description: z.custom<Value | string>().optional(),
  domains: z.array(z.string()).optional(),
  status: z.nativeEnum(EntityEntityStatus).optional(),
  tags: z.array(z.string()).optional(),
  annualSpend: z.number().optional(),
  approvedForUse: z.boolean().optional(),
  autoRenews: z.boolean().optional(),
  billingModel: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractRenewalAt: z.string().optional(),
  contractStartDate: z.string().optional(),
  entityRelationshipStateName: z.string().optional(),
  entitySecurityQuestionnaireStatusName: z.string().optional(),
  entitySourceTypeName: z.string().optional(),
  environmentName: z.string().optional(),
  hasSoc2: z.boolean().optional(),
  internalOwner: z.string().optional(),
  lastReviewedAt: z.string().optional(),
  mfaEnforced: z.boolean().optional(),
  mfaSupported: z.boolean().optional(),
  nextReviewAt: z.string().optional(),
  renewalRisk: z.string().optional(),
  reviewedBy: z.string().optional(),
  riskRating: z.string().optional(),
  riskScore: z.number().optional(),
  scopeName: z.string().optional().nullable(),
  soc2PeriodEnd: z.string().optional(),
  spendCurrency: z.string().optional(),
  ssoEnforced: z.boolean().optional(),
  statusPageURL: z
    .string()
    .optional()
    .refine((value) => isValidExternalHttpUrl(value), { message: 'Enter a valid http(s) URL' }),
  reviewFrequency: z.nativeEnum(EntityFrequency).optional(),
  terminationNoticeDays: z.number().optional(),
  tier: z.string().optional(),
})

export const bulkEditFieldSchema = z.object({
  approvedForUse: z.boolean().optional(),
  autoRenews: z.boolean().optional(),
  billingModel: z.string().optional(),
  entityRelationshipStateName: z.string().optional(),
  entitySecurityQuestionnaireStatusName: z.string().optional(),
  entitySourceTypeName: z.string().optional(),
  environmentName: z.string().optional(),
  hasSoc2: z.boolean().optional(),
  mfaEnforced: z.boolean().optional(),
  mfaSupported: z.boolean().optional(),
  ssoEnforced: z.boolean().optional(),
  nextReviewAt: z.string().optional(),
  renewalRisk: z.string().optional(),
  riskRating: z.string().optional(),
  riskScore: z.number().optional(),
  scopeName: z.string().optional(),
  soc2PeriodEnd: z.string().optional(),
  spendCurrency: z.string().optional(),
  tier: z.string().optional(),
})

export type EditVendorFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditVendorFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        spendCurrency: 'USD',
        billingModel: 'Monthly',
      },
    }),
  }
}

export default useFormSchema
