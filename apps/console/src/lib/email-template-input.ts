import { EmailTemplateNotificationTemplateFormat, EmailTemplateTemplateContext, type CreateEmailTemplateInput } from '@repo/codegen/src/schema'

type CampaignEmailTemplateFields = Pick<CreateEmailTemplateInput, 'key' | 'name' | 'defaults' | 'active'> & Partial<Pick<CreateEmailTemplateInput, 'locale' | 'format'>>

export const buildCampaignEmailTemplateInput = ({
  key,
  name,
  defaults,
  active,
  locale = 'en',
  format = EmailTemplateNotificationTemplateFormat.HTML,
}: CampaignEmailTemplateFields): CreateEmailTemplateInput => ({
  key,
  name: name.trim(),
  defaults,
  active,
  locale,
  format,
  templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
})
