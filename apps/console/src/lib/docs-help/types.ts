import type { VertexRagServiceClient } from '@google-cloud/aiplatform'
import type { GoogleGenAI } from '@google/genai'
import type { Storage } from '@google-cloud/storage'
import type { DocsHelpChunk } from '@/types/docs-help'

export type GoogleServiceAccountCredentials = { client_email: string; private_key: string; project_id?: string }

export type DocsHelpClients = { rag: VertexRagServiceClient; genAI: GoogleGenAI; storage: Storage }

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

export type DocsProvider = {
  retrieve: (query: string, topK?: number) => Promise<DocsRetrievedContext[]>
  pageText: (sourceUri: string) => Promise<string | null>
  summarize: (chunks: DocsHelpChunk[], query: string, signal: AbortSignal) => Promise<string>
  controlTitles: (controls: DocsControlTitleInput[]) => Promise<string[]>
  publicRepresentation: (input: PublicRepresentationInput) => Promise<string>
}
