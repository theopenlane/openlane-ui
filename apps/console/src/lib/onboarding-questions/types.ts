// Proposed extension, not yet in the backend contract: 'checkbox' is a single opt-in ("would
// you like help?") rendered as one checkbox, distinct from 'boolean' (a real yes/no choice)
export type OnboardingQuestionInputType = 'string' | 'multi-input' | 'select' | 'multiselect' | 'boolean' | 'checkbox'

// Proposed extension, not yet in the backend contract: restricts a string-type question to a
// specific format so the client can apply the matching validation/keyboard (e.g. auditor_email)
export type OnboardingQuestionFormat = 'email'

export interface OnboardingQuestionOption {
  value: string
  label: string
  description?: string
  hidden: boolean
  // Proposed extension, not yet in the backend contract: explicit display order, since the
  // payload otherwise relies on array position (see the frameworks options)
  order?: number
}

export interface OnboardingQuestion {
  key: string
  label?: string
  description?: string
  helpText?: string
  inputType: OnboardingQuestionInputType
  required: boolean
  hidden: boolean
  options?: OnboardingQuestionOption[]
  format?: OnboardingQuestionFormat
  checkboxLabel?: string
  dependsOn?: {
    key: string
    equals: string | boolean
  }
}

export interface OnboardingCard {
  key: string
  title: string
  description: string
}

export interface OnboardingStepSection {
  key: string
  title?: string
  description?: string
  helpText?: string
  examples?: string[]
  questions: OnboardingQuestion[]
}

export interface OnboardingStep {
  key: string
  title: string
  description?: string
  order: number
  hidden: boolean
  questions?: OnboardingQuestion[] | null
  cards?: OnboardingCard[]
  sections?: OnboardingStepSection[]
}

export interface OnboardingQuestionsResponse {
  success: boolean
  version: string
  steps: OnboardingStep[]
}
