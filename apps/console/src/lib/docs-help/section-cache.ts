// Docs change on deploy, not mid-session, so resolved sections are safe to hold
import type { SectionLookup, SectionResult } from '@/lib/docs-help/types'
import { SECTION_CACHE_MAX, SECTION_CACHE_TTL_MS } from '@/lib/docs-help/constants'

const sectionCache = new Map<string, { result: SectionResult; storedAt: number }>()

export const cacheKeyOf = (lookup: SectionLookup, section?: string) =>
  `${lookup.query}|${lookup.prefer ?? ''}|${Array.isArray(lookup.extractSection) ? lookup.extractSection.join(',') : lookup.extractSection}|${section ?? ''}`

export const readSectionCache = (key: string): SectionResult | null => {
  const hit = sectionCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.storedAt > SECTION_CACHE_TTL_MS) {
    sectionCache.delete(key)
    return null
  }
  sectionCache.delete(key)
  sectionCache.set(key, hit)
  return hit.result
}

export const writeSectionCache = (key: string, result: SectionResult) => {
  sectionCache.set(key, { result, storedAt: Date.now() })
  while (sectionCache.size > SECTION_CACHE_MAX) {
    const oldest = sectionCache.keys().next().value
    if (oldest === undefined) break
    sectionCache.delete(oldest)
  }
}
