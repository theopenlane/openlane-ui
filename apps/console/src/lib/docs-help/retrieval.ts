// Retrieval and whole-page resolution against the docs corpus
import type { DocsHelpClients, SectionLookup, SectionResult } from '@/lib/docs-help/types'
import { DEEP_RETRIEVAL_TOP_K } from '@/lib/docs-help/constants'
import { dedupeBySource, extractMarkdownSection, parseChunk, rankChunks } from '@/lib/docs-help/parse'
import { fetchGcsFile } from '@/lib/docs-help/clients'
import { cacheKeyOf, readSectionCache, writeSectionCache } from '@/lib/docs-help/section-cache'

export const lookupSection = async (clients: DocsHelpClients, parent: string, ragCorpus: string, lookup: SectionLookup, section?: string): Promise<SectionResult> => {
  const cacheKey = cacheKeyOf(lookup, section)
  const cached = readSectionCache(cacheKey)
  if (cached) return cached

  const [response] = await clients.rag.retrieveContexts({
    parent,
    query: { text: lookup.query, ragRetrievalConfig: { topK: DEEP_RETRIEVAL_TOP_K } },
    vertexRagStore: { ragResources: [{ ragCorpus }] },
  })

  const contexts = response.contexts?.contexts ?? []
  const ranked = rankChunks(dedupeBySource(contexts.map((context) => context?.text)), lookup.prefer, section)
  const top = ranked[0]
  if (!top?.source) return { section: '', title: '', source: '' }

  const gsUri = contexts.find((context) => context?.text && parseChunk(context.text).source === top.source)?.sourceUri
  const stored = gsUri?.startsWith('gs://') ? await fetchGcsFile(clients.storage, gsUri) : null
  const pageText = stored
    ? parseChunk(stored).text
    : contexts
        .map((context) => (context?.text ? parseChunk(context.text) : null))
        .filter((chunk) => chunk?.source === top.source)
        .map((chunk) => chunk?.text ?? '')
        .join('\n\n')

  const result = { section: extractMarkdownSection(pageText, lookup.extractSection) ?? '', title: top.title, source: top.source }
  writeSectionCache(cacheKey, result)
  return result
}
