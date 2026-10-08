import { COMPANY_DOMAINS_KEY } from './question-keys'
import { type OnboardingQuestion } from './types'

type TQuestionOverride = Partial<Pick<OnboardingQuestion, 'hidden' | 'required'>>

const QUESTION_OVERRIDES: Partial<Record<string, TQuestionOverride>> = {
  company_size: { hidden: true },
  company_sector: { hidden: true },
  company_sector_other: { hidden: true },
  user_role: { hidden: true },
  user_role_other: { hidden: true },
  user_department: { hidden: true },
  [COMPANY_DOMAINS_KEY]: { required: true },
}

export const applyQuestionOverrides = (question: OnboardingQuestion): OnboardingQuestion => ({ ...question, ...QUESTION_OVERRIDES[question.key] })
