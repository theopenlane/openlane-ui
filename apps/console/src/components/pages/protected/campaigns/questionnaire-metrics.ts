import { extractQuestions } from '@/components/pages/protected/questionnaire/responses-tab/extract-questions'

export const getSectionCount = (jsonconfig: unknown): number => {
  if (!jsonconfig || typeof jsonconfig !== 'object') return 0
  const pages = (jsonconfig as { pages?: unknown }).pages
  return Array.isArray(pages) ? pages.length : 0
}

export const getQuestionCount = (jsonconfig: unknown): number => extractQuestions(jsonconfig).length
