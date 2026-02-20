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
  annualSpend: z.number().nullable().optional(),
  approvedForUse: z.boolean().nullable().optional(),
  autoRenews: z.boolean().nullable().optional(),
  billingModel: z.string().nullable().optional(),
  contractEndDate: z.string().nullable().optional(),
  contractRenewalAt: z.string().nullable().optional(),
  contractStartDate: z.string().nullable().optional(),
  entityRelationshipStateID: z.string().nullable().optional(),
  entityRelationshipStateName: z.string().nullable().optional(),
  entitySecurityQuestionnaireStatusID: z.string().nullable().optional(),
  entitySecurityQuestionnaireStatusName: z.string().nullable().optional(),
  entitySourceTypeName: z.string().nullable().optional(),
  environmentID: z.string().nullable().optional(),
  environmentName: z.string().nullable().optional(),
  hasSoc2: z.boolean().nullable().optional(),
  internalOwner: z.string().nullable().optional(),
  internalOwnerGroupID: z.string().nullable().optional(),
  internalOwnerUserID: z.string().nullable().optional(),
  lastReviewedAt: z.string().nullable().optional(),
  mfaEnforced: z.boolean().nullable().optional(),
  mfaSupported: z.boolean().nullable().optional(),
  nextReviewAt: z.string().nullable().optional(),
  renewalRisk: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewedByGroupID: z.string().nullable().optional(),
  reviewedByUserID: z.string().nullable().optional(),
  riskRating: z.string().nullable().optional(),
  riskScore: z.number().nullable().optional(),
  scopeID: z.string().nullable().optional(),
  scopeName: z.string().nullable().optional(),
  soc2PeriodEnd: z.string().nullable().optional(),
  spendCurrency: z.string().nullable().optional(),
  ssoEnforced: z.boolean().nullable().optional(),
  statusPageURL: z.string().nullable().optional(),
  systemOwned: z.boolean().nullable().optional(),
  terminationNoticeDays: z.number().nullable().optional(),
  tier: z.string().nullable().optional(),
})

export type CreateVendorFormData = z.infer<typeof formSchema>
export type EditVendorFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<CreateVendorFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {},
    }),
  }
}

export default useFormSchema
