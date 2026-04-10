'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CampaignCampaignType } from '@repo/codegen/src/schema'

const campaignFormSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  campaignType: z.nativeEnum(CampaignCampaignType).optional(),
  questionnaireTemplateID: z.string().optional(),
  templateID: z.string(),
  emailBrandingID: z.string().optional(),
  sendImmediately: z.boolean(),
  dueDate: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  reminderEnabled: z.boolean(),
})

export type CampaignFormData = z.infer<typeof campaignFormSchema>

const useCampaignFormSchema = () => {
  return {
    form: useForm<CampaignFormData>({
      resolver: zodResolver(campaignFormSchema),
      defaultValues: {
        name: '',
        description: '',
        campaignType: undefined,
        questionnaireTemplateID: '',
        templateID: '',
        emailBrandingID: undefined,
        sendImmediately: true,
        dueDate: null,
        scheduledAt: null,
        reminderEnabled: true,
      },
    }),
  }
}

export default useCampaignFormSchema
