import { ACKNOWLEDGEMENT_QUESTION_TYPE, DEFAULT_ACKNOWLEDGEMENT_TITLE } from '@/components/shared/survey/acknowledgement/acknowledgement-type'
import { PDF_DOCUMENT_QUESTION_TYPE, pdfDocumentTitleFromFileName } from '@/components/shared/survey/pdf-document/pdf-document-type'

export type ExtractedQuestion = {
  name: string
  title: string
  type: string
}

const CUSTOM_QUESTION_DEFAULT_TITLES: Record<string, (element: Record<string, unknown>) => string> = {
  [PDF_DOCUMENT_QUESTION_TYPE]: (element) => (typeof element.pdfFileName === 'string' ? pdfDocumentTitleFromFileName(element.pdfFileName) : ''),
  [ACKNOWLEDGEMENT_QUESTION_TYPE]: () => DEFAULT_ACKNOWLEDGEMENT_TITLE,
}

export const extractQuestions = (jsonconfig: unknown): ExtractedQuestion[] => {
  if (!jsonconfig || typeof jsonconfig !== 'object') return []

  const config = jsonconfig as Record<string, unknown>
  const pages = config.pages as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(pages)) return []

  const questions: ExtractedQuestion[] = []
  const seenQuestionNames = new Set<string>()

  const getStringValue = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim()) return value
    return null
  }

  const pushQuestion = (element: Record<string, unknown>) => {
    const name = getStringValue(element.name)
    const type = getStringValue(element.type)
    if (!name || !type || seenQuestionNames.has(name)) return
    const title = getStringValue(element.title) ?? getStringValue(CUSTOM_QUESTION_DEFAULT_TITLES[type]?.(element)) ?? name
    seenQuestionNames.add(name)
    questions.push({
      name,
      title,
      type,
    })
  }

  const walkElements = (elements: unknown[]) => {
    for (const el of elements) {
      if (!el || typeof el !== 'object') continue
      const element = el as Record<string, unknown>
      const type = getStringValue(element.type)
      const nestedElements = Array.isArray(element.elements) ? (element.elements as unknown[]) : []
      const templateElements = Array.isArray(element.templateElements) ? (element.templateElements as unknown[]) : []

      if (type === 'panel' && nestedElements.length) {
        walkElements(nestedElements)
        continue
      }

      pushQuestion(element)

      if (nestedElements.length) walkElements(nestedElements)
      if (templateElements.length) walkElements(templateElements)
    }
  }

  for (const page of pages) {
    if (Array.isArray(page.elements)) {
      walkElements(page.elements as unknown[])
    }
  }

  return questions
}
