'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export const addContractSchema = z.object({
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractRenewalAt: z.string().optional(),
  terminationNoticeDays: z.string().optional(),
  annualSpend: z.string().optional(),
  spendCurrency: z.string().optional(),
  billingModel: z.string().optional(),
  autoRenews: z.boolean().optional(),
})

export type AddContractFormData = z.infer<typeof addContractSchema>

const useContractFormSchema = () => {
  return {
    form: useForm<AddContractFormData>({
      resolver: zodResolver(addContractSchema),
      defaultValues: {
        contractStartDate: '',
        contractEndDate: '',
        contractRenewalAt: '',
        terminationNoticeDays: '',
        annualSpend: '',
        spendCurrency: 'USD',
        billingModel: '',
        autoRenews: false,
      },
    }),
  }
}

export default useContractFormSchema
