export type DocsHelpChunk = { title: string; source: string; text: string }

export type DocsSection = 'platform' | 'developers'

export type DocsHelpResponse = { chunks: DocsHelpChunk[]; summary: string | null }

export type DocsHelpFrame = { chunks?: DocsHelpChunk[]; summary?: string }
