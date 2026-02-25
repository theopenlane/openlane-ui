'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Value } from 'platejs'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  riskKindName: z.string().optional(),
  riskCategoryName: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  impact: z.nativeEnum(RiskRiskImpact).optional(),
  likelihood: z.nativeEnum(RiskRiskLikelihood).optional(),
  status: z.nativeEnum(RiskRiskStatus).optional(),
  details: z.custom<Value | string>().optional(),
  detailsJSON: z.custom<Value>().optional(),
  businessCosts: z.custom<Value | string>().optional(),
  mitigation: z.custom<Value | string>().optional(),
  tags: z.array(z.string().optional()),
  stakeholderID: z.string().optional(),
  delegateID: z.string().optional(),
})

export type EditRisksFormData = z.infer<typeof formSchema>
export type CreateRisksFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditRisksFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        score: 0,
        impact: RiskRiskImpact.LOW,
        likelihood: RiskRiskLikelihood.UNLIKELY,
        status: RiskRiskStatus.IDENTIFIED,
        details: '',
        mitigation: '',
        businessCosts: '',
        tags: [],
      },
    }),
  }
}

export default useFormSchema
