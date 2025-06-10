'use client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiskRiskImpact, RiskRiskLikelihood, RiskRiskStatus } from '@repo/codegen/src/schema'
import { Value } from '@udecode/plate-common'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  riskType: z.string().optional(),
  category: z.string().optional(),
  score: z.coerce.number().min(0).max(100).optional(),
  impact: z.nativeEnum(RiskRiskImpact).optional(),
  likelihood: z.nativeEnum(RiskRiskLikelihood).optional(),
  status: z.nativeEnum(RiskRiskStatus).optional(),
  details: z.custom<Value | string>().optional(),
  businessCosts: z.custom<Value | string>().optional(),
  mitigation: z.custom<Value | string>().optional(),
  tags: z.array(z.string().optional()),
  stakeholderID: z.string().optional(),
  delegateID: z.string().optional(),
})

export type EditRisksFormData = z.infer<typeof formSchema>

const useFormSchema = () => {
  return {
    form: useForm<EditRisksFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        riskType: '',
        category: '',
        score: 0,
        impact: RiskRiskImpact.LOW,
        likelihood: RiskRiskLikelihood.UNLIKELY,
        status: RiskRiskStatus.OPEN,
        details: '',
        mitigation: '',
        businessCosts: '',
        tags: [],
      },
    }),
  }
}

export default useFormSchema
