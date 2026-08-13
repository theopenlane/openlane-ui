// programmatic docs-help queries so pages phrase lookups consistently by
// intent: create pages ask how to create the object, detail pages ask what
// the object is, list pages ask for the overview
export type DocsHelpIntent = 'create' | 'view' | 'list'

export function docsHelpQuery(intent: DocsHelpIntent, object: string, detail?: string): string {
  const subject = [object, detail].filter(Boolean).join(' ')
  switch (intent) {
    case 'create':
      return `how to create ${subject}`
    case 'view':
      return `what is ${subject}`
    case 'list':
      return `${subject} overview`
  }
}
