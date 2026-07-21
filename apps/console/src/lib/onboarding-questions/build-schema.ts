import { z, type ZodTypeAny } from 'zod'
import { type OnboardingQuestion, type OnboardingStep } from './types'

const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const buildFieldSchema = (question: OnboardingQuestion): ZodTypeAny => {
  switch (question.inputType) {
    case 'string': {
      // company_name keeps a stricter, human-friendly minimum beyond what the generic
      // `required` flag can express
      if (question.key === 'company_name') {
        return z.string().min(3, 'Company name requires at least 3 characters')
      }
      if (question.format === 'email') {
        const email = z.string().email('Enter a valid email address')
        return question.required ? email : email.optional().or(z.literal(''))
      }
      return question.required ? z.string().min(1, `${question.label} is required`) : z.string().optional()
    }
    case 'multi-input': {
      // company_domains keeps its per-entry domain-format check regardless of required-ness
      const items = question.key === 'company_domains' ? z.array(z.string().regex(DOMAIN_REGEX, 'Invalid domain format')) : z.array(z.string())
      return question.required ? items.min(1, `${question.label} is required`) : items.optional()
    }
    case 'select':
      return question.required ? z.string().min(1, `${question.label} is required`) : z.string().optional()
    case 'multiselect': {
      const items = z.array(z.string())
      return question.required ? items.min(1, `${question.label} is required`) : items.optional()
    }
    case 'boolean':
    case 'checkbox':
      return question.required ? z.boolean({ required_error: `${question.label} is required` }) : z.boolean().optional()
  }
}

const allQuestionsForStep = (step: OnboardingStep): OnboardingQuestion[] => [...(step.questions ?? []), ...(step.sections ?? []).flatMap((section) => section.questions)]

export const buildOnboardingSchema = (steps: OnboardingStep[]) => {
  const shape: Record<string, ZodTypeAny> = {}

  for (const step of steps) {
    for (const question of allQuestionsForStep(step)) {
      shape[question.key] = buildFieldSchema(question)
    }
  }

  return z.object(shape)
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

export const getRequiredKeysForStep = (step: OnboardingStep): string[] =>
  allQuestionsForStep(step)
    .filter((question) => question.required)
    .map((question) => question.key)

// items without an explicit order keep their original array position, sorted after any that do --
// shared by anything with an optional `order` field (question options, step sections)
export const sortByOrder = <T extends { order?: number }>(items: T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.order ?? Infinity) - (b.item.order ?? Infinity) || a.index - b.index)
    .map(({ item }) => item)

export const isQuestionVisible = (question: OnboardingQuestion, values: Record<string, unknown>): boolean => {
  if (!question.dependsOn) return true

  const parentValue = values[question.dependsOn.key]
  if (Array.isArray(parentValue)) {
    return parentValue.includes(question.dependsOn.equals)
  }
  return parentValue === question.dependsOn.equals
}
