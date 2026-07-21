import { type CreateOnboardingInput } from '@repo/codegen/src/schema'
import { type OnboardingQuestion } from './types'

const OTHER_OPTION_VALUE = 'other'
const AUDITOR_STATUS_HAS_ONE = 'yes'
const AUDITOR_STATUS_WANTS_RECOMMENDATIONS = 'recommendations'
const VCISO_PREFERENCE_CONNECT = 'connect_vciso_partner'

export const MAPPED_QUESTION_KEYS = new Set([
  'company_name',
  'company_domains',
  'company_size',
  'company_sector',
  'company_sector_other',
  'user_role',
  'user_role_other',
  'user_department',
  'frameworks',
  'other_framework_description',
  'has_existing_controls',
  'has_existing_policies',
  'auditor_status',
  'auditor_name',
  'auditor_email',
  'vciso_preference',
  'demo_requested',
])

const readString = (values: Record<string, unknown>, key: string): string => {
  const value = values[key]
  return typeof value === 'string' ? value : ''
}

const readStringArray = (values: Record<string, unknown>, key: string): string[] => {
  const value = values[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

const readBoolean = (values: Record<string, unknown>, key: string): boolean | undefined => {
  const value = values[key]
  return typeof value === 'boolean' ? value : undefined
}

const readOtherable = (values: Record<string, unknown>, key: string, otherKey: string): string => {
  const value = readString(values, key)
  return value === OTHER_OPTION_VALUE ? readString(values, otherKey) : value
}

export const getUnmappedQuestionKeys = (questions: OnboardingQuestion[]): string[] => questions.filter((question) => !MAPPED_QUESTION_KEYS.has(question.key)).map((question) => question.key)

export const getSelectedFrameworkLabels = (questions: OnboardingQuestion[], values: Record<string, unknown>): string[] => {
  const frameworksQuestion = questions.find((question) => question.key === 'frameworks')
  if (!frameworksQuestion) return []

  return readStringArray(values, 'frameworks')
    .map((value) => frameworksQuestion.options?.find((option) => option.value === value)?.label)
    .filter((label): label is string => !!label)
}

export const buildOnboardingInput = (questions: OnboardingQuestion[], values: Record<string, unknown>): CreateOnboardingInput => {
  const auditorStatus = readString(values, 'auditor_status')
  const hasAuditor = auditorStatus === AUDITOR_STATUS_HAS_ONE

  const additionalAnswers = Object.fromEntries(
    getUnmappedQuestionKeys(questions)
      .filter((key) => values[key] !== undefined)
      .map((key) => [key, values[key]]),
  )

  return {
    companyName: readString(values, 'company_name'),
    domains: readStringArray(values, 'company_domains'),
    companyDetails: {
      size: readString(values, 'company_size'),
      sector: readOtherable(values, 'company_sector', 'company_sector_other'),
    },
    userDetails: {
      role: readOtherable(values, 'user_role', 'user_role_other'),
      department: readString(values, 'user_department'),
    },
    compliance: {
      frameworks: readStringArray(values, 'frameworks'),
      other_framework_description: readString(values, 'other_framework_description') || undefined,
      existing_controls: readBoolean(values, 'has_existing_controls'),
      existing_policies_procedures: readBoolean(values, 'has_existing_policies'),
      has_auditor: hasAuditor,
      recommend_auditors: auditorStatus === AUDITOR_STATUS_WANTS_RECOMMENDATIONS,
      auditor_name: hasAuditor ? readString(values, 'auditor_name') || undefined : undefined,
      auditor_email: hasAuditor ? readString(values, 'auditor_email') || undefined : undefined,
      recommend_vciso_partner: readString(values, 'vciso_preference') === VCISO_PREFERENCE_CONNECT,
      ...(Object.keys(additionalAnswers).length > 0 ? { additional_answers: additionalAnswers } : {}),
    },
    demoRequested: readBoolean(values, 'demo_requested') ?? false,
  }
}
