import { type EmailTemplateType, isEmailTemplateType } from '@/lib/email-template-type'

export const EMAIL_TEMPLATES_HREF = '/automation/email-templates'

const EDITOR_HREF = `${EMAIL_TEMPLATES_HREF}/editor`

export const emailTemplateEditHref = (id: string) => `${EDITOR_HREF}?${new URLSearchParams({ id })}`

export const emailTemplateCreateHref = (type?: EmailTemplateType) => (type ? `${EDITOR_HREF}?${new URLSearchParams({ type })}` : EDITOR_HREF)

export const readEmailTemplateEditorParams = (searchParams: Pick<URLSearchParams, 'get'>) => {
  const type = searchParams.get('type')
  return { id: searchParams.get('id') ?? undefined, type: type && isEmailTemplateType(type) ? type : undefined }
}
