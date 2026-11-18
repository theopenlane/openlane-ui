import type { EmailTemplateWhereInput } from '@repo/codegen/src/schema'
import { isOneOf } from '@/utils/type-guards'

export enum EmailTemplateType {
  GENERAL = 'GENERAL',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
}

export const isEmailTemplateType = isOneOf(Object.values(EmailTemplateType))

export const QUESTIONNAIRE_EMAIL_TEMPLATE_KEY = 'QuestionnaireAccessRequest'

export const emailTemplateTypeForKey = (key: string): EmailTemplateType => (key === QUESTIONNAIRE_EMAIL_TEMPLATE_KEY ? EmailTemplateType.QUESTIONNAIRE : EmailTemplateType.GENERAL)

export const catalogEntryForType = <T extends { key: string }>(entries: T[], type: EmailTemplateType): T | undefined => entries.find((entry) => emailTemplateTypeForKey(entry.key) === type)

export const emailTemplateTypesInCatalog = (entries: { key: string }[]): EmailTemplateType[] =>
  Object.values(EmailTemplateType).filter((type) => entries.some((entry) => emailTemplateTypeForKey(entry.key) === type))

export const emailTemplateTypeWhere = (type: EmailTemplateType): EmailTemplateWhereInput =>
  type === EmailTemplateType.QUESTIONNAIRE ? { key: QUESTIONNAIRE_EMAIL_TEMPLATE_KEY } : { keyNEQ: QUESTIONNAIRE_EMAIL_TEMPLATE_KEY }
