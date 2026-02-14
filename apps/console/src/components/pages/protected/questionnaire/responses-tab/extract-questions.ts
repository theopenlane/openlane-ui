export type ExtractedQuestion = {
  name: string
  title: string
  type: string
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
    const title = getStringValue(element.title) ?? name
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
