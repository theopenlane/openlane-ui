// Retrieval and whole-page resolution against the docs corpus
import type { DocsProvider, SectionLookup, SectionResult } from '@/lib/docs-help/types'
import { DEEP_RETRIEVAL_TOP_K } from '@/lib/docs-help/constants'
import { dedupeBySource, extractMarkdownSection, parseChunk, rankChunks } from '@/lib/docs-help/parse'
import { cacheKeyOf, readSectionCache, writeSectionCache } from '@/lib/docs-help/section-cache'

export const lookupSection = async (docs: DocsProvider, lookup: SectionLookup, section?: string): Promise<SectionResult> => {
  const cacheKey = cacheKeyOf(lookup, section)
  const cached = readSectionCache(cacheKey)
  if (cached) return cached

  const contexts = await docs.retrieve(lookup.query, DEEP_RETRIEVAL_TOP_K)
  const ranked = rankChunks(dedupeBySource(contexts.map((context) => context.text)), lookup.prefer, section)
  const top = ranked[0]
  if (!top?.source) return { section: '', title: '', source: '' }

  const sourceUri = contexts.find((context) => parseChunk(context.text).source === top.source)?.sourceUri
  const stored = sourceUri ? await docs.pageText(sourceUri) : null
  const pageText = stored
    ? parseChunk(stored).text
    : contexts
        .map((context) => parseChunk(context.text))
        .filter((chunk) => chunk.source === top.source)
        .map((chunk) => chunk.text)
        .join('\n\n')

  const result = { section: extractMarkdownSection(pageText, lookup.extractSection) ?? '', title: top.title, source: top.source }
  writeSectionCache(cacheKey, result)
  return result
}
