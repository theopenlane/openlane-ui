'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const campaignFormSchema = z.object({
  name: z.string().trim().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  questionnaireTemplateID: z.string().optional(),
  emailTemplateID: z.string().optional(),
})

export type CampaignFormData = z.infer<typeof campaignFormSchema>

const useCampaignFormSchema = () => {
  return {
    form: useForm<CampaignFormData>({
      resolver: zodResolver(campaignFormSchema),
      defaultValues: {
        name: '',
        description: '',
        questionnaireTemplateID: '',
        emailTemplateID: '',
      },
    }),
  }
}

export default useCampaignFormSchema
