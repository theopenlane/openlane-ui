// Retrieval and whole-page resolution against the docs corpus
import type { DocsProvider, SectionLookup, SectionResult } from '@/lib/docs-help/types'
import { DEEP_RETRIEVAL_TOP_K } from '@/lib/docs-help/constants'
import { dedupeBySource, extractMarkdownSection, parseChunk, rankChunks } from '@/lib/docs-help/parse'
import { cacheKeyOf, readSectionCache, writeSectionCache } from '@/lib/docs-help/section-cache'

export const resolvePageText = async (docs: DocsProvider, sourceUri: string | undefined, fallbackText: () => string, signal?: AbortSignal): Promise<{ text: string; degraded: boolean }> => {
  const stored = sourceUri && !signal?.aborted ? await docs.pageText(sourceUri, signal) : null
  return {
    text: stored ? parseChunk(stored).text : fallbackText(),
    degraded: Boolean(signal?.aborted || (sourceUri && !stored)),
  }
}

export const lookupSection = async (docs: DocsProvider, lookup: SectionLookup, section?: string, signal?: AbortSignal): Promise<SectionResult> => {
  const cacheKey = cacheKeyOf(lookup, section)
  const cached = readSectionCache(cacheKey)
  if (cached) return cached

  const contexts = await docs.retrieve(lookup.query, { topK: DEEP_RETRIEVAL_TOP_K, signal })
  const parsed = contexts.map((context) => ({ chunk: parseChunk(context.text), sourceUri: context.sourceUri }))
  const ranked = rankChunks(dedupeBySource(contexts.map((context) => context.text)), lookup.prefer, section)
  const top = ranked[0]
  if (!top?.source) return { section: '', title: '', source: '' }

  const sourceUri = parsed.find(({ chunk }) => chunk.source === top.source)?.sourceUri
  const fallbackText = () =>
    parsed
      .filter(({ chunk }) => chunk.source === top.source)
      .map(({ chunk }) => chunk.text)
      .join('\n\n')
  const { text: pageText, degraded } = await resolvePageText(docs, sourceUri, fallbackText, signal)

  const result = { section: extractMarkdownSection(pageText, lookup.extractSection) ?? '', title: top.title, source: top.source }
  if (!degraded) writeSectionCache(cacheKey, result)
  return result
}
