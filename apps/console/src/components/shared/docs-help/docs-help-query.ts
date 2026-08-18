export type DocsHelpIntent = 'create' | 'view' | 'list'

const QUERY_BY_INTENT: Record<DocsHelpIntent, (subject: string) => string> = {
  create: (subject) => `how to create ${subject}`,
  view: (subject) => `what is ${subject}`,
  list: (subject) => `${subject} overview`,
}

export const docsHelpQuery = (intent: DocsHelpIntent, object: string, detail?: string): string => QUERY_BY_INTENT[intent]([object, detail].filter(Boolean).join(' '))
