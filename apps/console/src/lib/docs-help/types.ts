import type { VertexRagServiceClient } from '@google-cloud/aiplatform'
import type { Storage } from '@google-cloud/storage'
import type { ScreenedGenAI } from '@/lib/google/vertex-genai'
import type { DocsHelpChunk } from '@/types/docs-help'

export type DocsHelpClients = { rag: VertexRagServiceClient; genAI: ScreenedGenAI; storage: Storage }

export type SectionLookup = { query: string; prefer?: string; extractSection: string | string[] }
export type SectionResult = { section: string; title: string; source: string }

export type DocsControlTitleInput = { refCode?: string; description?: string }

export type PublicRepresentationInput = {
  refCode?: string
  referenceFramework?: string
  description?: string
  implementations?: string[]
  objectives?: string[]
  existing?: string
}

export type DocsPolicyMappingRow = { policy: string; frameworks: string[] }

export type DocsRetrievedContext = { text: string; sourceUri?: string }

export type DocsRetrieveOptions = { topK?: number; signal?: AbortSignal }

export type DocsProvider = {
  retrieve: (query: string, options?: DocsRetrieveOptions) => Promise<DocsRetrievedContext[]>
  pageText: (sourceUri: string) => Promise<string | null>
  summarize: (chunks: DocsHelpChunk[], query: string, signal: AbortSignal) => Promise<string>
  controlTitles: (controls: DocsControlTitleInput[], signal?: AbortSignal) => Promise<string[]>
  publicRepresentation: (input: PublicRepresentationInput, signal?: AbortSignal) => Promise<string>
}
