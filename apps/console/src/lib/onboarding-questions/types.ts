export type OnboardingQuestionInputType = 'string' | 'multi-input' | 'select' | 'multiselect' | 'boolean' | 'checkbox'

export type OnboardingQuestionFormat = 'email' | 'domain'

export interface OnboardingQuestionOption {
  value: string
  label: string
  description?: string
  hidden: boolean
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

export type SubmitStage = 'form' | 'transition' | 'ready'

export interface OnboardingQuestionsResponse {
  success: boolean
  version: string
  steps: OnboardingStep[]
}
