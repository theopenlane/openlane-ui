import { z, type ZodTypeAny } from 'zod'
import { type OnboardingQuestion, type OnboardingStep } from './types'

export const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const allQuestionsForStep = (step: OnboardingStep): OnboardingQuestion[] => [...(step.questions ?? []), ...(step.sections ?? []).flatMap((section) => section.questions)]

export const isQuestionVisible = (question: OnboardingQuestion, values: Record<string, unknown>): boolean => {
  if (!question.dependsOn) return true

  const parentValue = values[question.dependsOn.key]
  if (Array.isArray(parentValue)) {
    return parentValue.includes(question.dependsOn.equals)
  }
  return parentValue === question.dependsOn.equals
}

export const isAnswered = (value: unknown): boolean => {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

const buildFieldSchema = (question: OnboardingQuestion): ZodTypeAny => {
  switch (question.inputType) {
    case 'string': {
      if (question.format === 'email') {
        return z.string().email('Enter a valid email address').or(z.literal('')).optional()
      }
      if (question.key === 'company_name') {
        return z.string().min(3, 'Company name requires at least 3 characters').or(z.literal('')).optional()
      }
      return z.string().optional()
    }
    case 'multi-input': {
      const items = question.format === 'domain' ? z.array(z.string().regex(DOMAIN_REGEX, 'Invalid domain format')) : z.array(z.string())
      return items.optional()
    }
    case 'select':
      return z.string().optional()
    case 'multiselect':
      return z.array(z.string()).optional()
    case 'boolean':
    case 'checkbox':
      return z.boolean().optional()
  }
}

export const buildOnboardingSchema = (steps: OnboardingStep[]) => {
  const shape: Record<string, ZodTypeAny> = {}
  const questions: OnboardingQuestion[] = []

  for (const step of steps) {
    for (const question of allQuestionsForStep(step)) {
      shape[question.key] = buildFieldSchema(question)
      questions.push(question)
    }
  }

  return z.object(shape).superRefine((values: Record<string, unknown>, ctx) => {
    for (const question of questions) {
      if (!question.required || !isQuestionVisible(question, values) || isAnswered(values[question.key])) continue

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [question.key],
        message: `${question.label ?? 'This field'} is required`,
      })
    }
  })
}

export const buildOnboardingDefaultValues = (steps: OnboardingStep[]): Record<string, string | string[] | boolean | undefined> => {
  const defaults: Record<string, string | string[] | boolean | undefined> = {}

  for (const step of steps) {
    for (const question of allQuestionsForStep(step)) {
      switch (question.inputType) {
        case 'multi-input':
        case 'multiselect':
          defaults[question.key] = []
          break
        case 'string':
        case 'select':
          defaults[question.key] = ''
          break
        case 'boolean':
          defaults[question.key] = undefined
          break
        case 'checkbox':
          defaults[question.key] = false
          break
      }
    }
  }

  return defaults
}

export const getRequiredKeysForStep = (step: OnboardingStep, values: Record<string, unknown>): string[] =>
  allQuestionsForStep(step)
    .filter((question) => question.required && isQuestionVisible(question, values))
    .map((question) => question.key)

export const getVisibleKeysForStep = (step: OnboardingStep, values: Record<string, unknown>): string[] =>
  allQuestionsForStep(step)
    .filter((question) => isQuestionVisible(question, values))
    .map((question) => question.key)

export const sortByOrder = <T extends { order?: number }>(items: T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? Infinity) - (b.item.order ?? Infinity) || a.index - b.index)
    .map(({ item }) => item)
