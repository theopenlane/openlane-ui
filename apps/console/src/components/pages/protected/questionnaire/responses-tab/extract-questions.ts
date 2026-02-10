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

  const walkElements = (elements: unknown[]) => {
    for (const el of elements) {
      if (!el || typeof el !== 'object') continue
      const element = el as Record<string, unknown>

      if (element.type === 'panel' && Array.isArray(element.elements)) {
        walkElements(element.elements as unknown[])
        continue
      }

      if (element.name && element.type) {
        questions.push({
          name: element.name as string,
          title: (element.title as string) || (element.name as string),
          type: element.type as string,
        })
      }
    }
  }

  for (const page of pages) {
    if (Array.isArray(page.elements)) {
      walkElements(page.elements as unknown[])
    }
  }

  return questions
}
