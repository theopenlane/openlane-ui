'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QUESTIONNAIRE_SOURCES } from '../../questionnaire-source'

const campaignFormSchema = z.object({
  name: z.string().trim().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  questionnaire: z.object({ source: z.enum(QUESTIONNAIRE_SOURCES), id: z.string().min(1) }).optional(),
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
        questionnaire: undefined,
        emailTemplateID: '',
      },
    }),
  }
}

export default useCampaignFormSchema
