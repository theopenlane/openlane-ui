import type { DocsControlTitleInput, DocsProvider, DocsRetrievedContext, PublicRepresentationInput } from '@/lib/docs-help/types'
import type { DocsHelpChunk } from '@/types/docs-help'
import { DEFAULT_REPRESENTATION_TARGET, REPRESENTATION_LENGTH_MULTIPLIER } from '@/lib/docs-help/constants'
import { dropRunawaySentences } from '@/lib/docs-help/ai'
import { htmlToText, stripInlineMarkdown } from '@/lib/docs-help/parse'
import { DEVELOPER_PAGES, PLATFORM_PAGES, demoPageSource, type DemoDocsPage } from '@/lib/docs-help/demo/corpus'
import { FRAMEWORK_CONTROL_PAGES } from '@/lib/docs-help/demo/framework-controls'

const RETRIEVAL_LATENCY_MS = 180
const GENERATION_LATENCY_MS = 400

const EXCERPT_CHARS = 1200

const DEFAULT_TOP_K = 8

const SUMMARY_PREFIX = 'Demo summary — '

const SUMMARY_SENTENCES = 2

const MAX_TITLE_WORDS = 8

const WEIGHT_TITLE = 6
const WEIGHT_KEYWORD = 5
const WEIGHT_PATH = 4
const WEIGHT_HEADING = 2
const WEIGHT_BODY = 1

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'with'])

const FALLBACK_PATHS = ['/docs/platform/overview', '/docs/platform/compliance-management/controls/overview', '/docs/platform/compliance-management/programs/overview']

const ALL_PAGES: DemoDocsPage[] = [...PLATFORM_PAGES, ...FRAMEWORK_CONTROL_PAGES, ...DEVELOPER_PAGES]

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map((token) => token.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean)

const singular = (word: string): string => {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('sses')) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  return word
}

const terms = (value: string): string[] => tokenize(value).map(singular)

const queryTerms = (value: string): string[] => [...new Set(terms(value))].filter((term) => !STOP_WORDS.has(term))

type IndexedPage = {
  page: DemoDocsPage
  source: string
  raw: string
  excerpt: string
  weights: Map<string, number>
}

const rawChunkOf = (page: DemoDocsPage, source: string, text: string): string => `Title: ${page.title} | Openlane\nSource: ${source}\n\n${text}`

const excerptOf = (body: string): string => {
  if (body.length <= EXCERPT_CHARS) return body
  const clipped = body.slice(0, EXCERPT_CHARS)
  const lastSpace = clipped.lastIndexOf(' ')
  return lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped
}

const weigh = (weights: Map<string, number>, value: string, weight: number) => {
  for (const term of terms(value)) {
    if ((weights.get(term) ?? 0) < weight) weights.set(term, weight)
  }
}

const indexPage = (page: DemoDocsPage): IndexedPage => {
  const source = demoPageSource(page)
  const headings = page.body
    .split('\n')
    .filter((line) => line.startsWith('#'))
    .join(' ')

  const weights = new Map<string, number>()
  weigh(weights, page.body, WEIGHT_BODY)
  weigh(weights, headings, WEIGHT_HEADING)
  weigh(weights, page.path.replace(/[/-]/g, ' '), WEIGHT_PATH)
  weigh(weights, (page.keywords ?? []).join(' '), WEIGHT_KEYWORD)
  weigh(weights, page.title, WEIGHT_TITLE)

  return { page, source, raw: rawChunkOf(page, source, page.body), excerpt: rawChunkOf(page, source, excerptOf(page.body)), weights }
}

const INDEX: IndexedPage[] = ALL_PAGES.map(indexPage)
const BY_SOURCE = new Map(INDEX.map((entry) => [entry.source, entry]))
const FALLBACK = FALLBACK_PATHS.flatMap((path) => INDEX.filter((entry) => entry.page.path === path))

const scoreOf = (entry: IndexedPage, searchTerms: string[]): number => searchTerms.reduce((total, term) => total + (entry.weights.get(term) ?? 0), 0)

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const search = (query: string, topK: number): IndexedPage[] => {
  const searchTerms = queryTerms(query)
  if (searchTerms.length === 0) return FALLBACK

  const scored = INDEX.map((entry) => ({ entry, score: scoreOf(entry, searchTerms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ entry }) => entry)

  return scored.length ? scored : FALLBACK
}

const proseOf = (text: string): string =>
  stripInlineMarkdown(
    text
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#') && !/^[*-]\s/.test(line) && !line.startsWith('|'))
      .join(' '),
  )

const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.trim().length > 0)

const firstSentences = (text: string, count: number): string => sentences(text).slice(0, count).join(' ').trim()

const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

const titleCase = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (index > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')

const MIN_TITLE_WORDS = 2

const trimDanglingWords = (words: string[]): string[] => {
  const trimmed = [...words]
  while (trimmed.length > MIN_TITLE_WORDS) {
    const last = trimmed[trimmed.length - 1].toLowerCase()
    const penultimate = trimmed[trimmed.length - 2].toLowerCase()
    if (!SMALL_WORDS.has(last) && !SMALL_WORDS.has(penultimate)) break
    trimmed.pop()
  }
  return trimmed
}

const titleFromDescription = (description?: string): string => {
  const opening = firstSentences(htmlToText(description ?? ''), 1)
  if (!opening) return ''
  const words = opening
    .replace(/^(the|this|a|an)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
  const kept = words.length > MAX_TITLE_WORDS ? trimDanglingWords(words.slice(0, MAX_TITLE_WORDS)) : words
  return titleCase(kept.join(' ').replace(/[.,;:]+$/, ''))
}

const lowerFirst = (value: string): string => (value ? value.charAt(0).toLowerCase() + value.slice(1) : value)

const withoutTrailingStop = (value: string): string => value.replace(/[.\s]+$/, '')

export const demoDocsProvider: DocsProvider = {
  retrieve: async (query: string, topK?: number): Promise<DocsRetrievedContext[]> => {
    await pause(RETRIEVAL_LATENCY_MS)
    return search(query, topK ?? DEFAULT_TOP_K).map((entry) => ({ text: entry.excerpt, sourceUri: entry.source }))
  },

  pageText: async (sourceUri: string): Promise<string | null> => {
    await pause(RETRIEVAL_LATENCY_MS)
    return BY_SOURCE.get(sourceUri)?.raw ?? null
  },

  summarize: async (chunks: DocsHelpChunk[], query: string, signal: AbortSignal): Promise<string> => {
    if (chunks.length === 0) return ''
    await pause(GENERATION_LATENCY_MS)
    if (signal.aborted) return ''

    const body = firstSentences(proseOf(chunks[0].text), SUMMARY_SENTENCES)
    if (!body) return ''

    const topic = query.replace(/\s+/g, ' ').trim()
    return `${SUMMARY_PREFIX}${body} These excerpts are the closest match in the bundled demo docs for "${topic}".`
  },

  controlTitles: async (controls: DocsControlTitleInput[]): Promise<string[]> => {
    await pause(GENERATION_LATENCY_MS)
    return controls.map((control) => titleFromDescription(control.description))
  },

  publicRepresentation: async (input: PublicRepresentationInput): Promise<string> => {
    await pause(GENERATION_LATENCY_MS)

    const requirement = firstSentences(htmlToText(input.description ?? ''), 1)
    const implementation = firstSentences(htmlToText(input.implementations?.[0] ?? ''), 1)
    const objective = firstSentences(htmlToText(input.objectives?.[0] ?? ''), 1)
    const control = [input.referenceFramework, input.refCode].filter(Boolean).join(' ')

    const parts = [
      implementation
        ? `The organization ${lowerFirst(withoutTrailingStop(implementation))}.`
        : requirement
          ? `The organization maintains controls to ensure ${lowerFirst(withoutTrailingStop(requirement))}.`
          : 'The organization maintains documented controls covering this requirement.',
      control ? `This practice is aligned to ${control}.` : '',
      objective ? `Effectiveness is measured by whether ${lowerFirst(withoutTrailingStop(objective))}.` : '',
      'Supporting evidence is retained and reviewed on a defined schedule.',
    ].filter(Boolean)

    const target = requirement.length || DEFAULT_REPRESENTATION_TARGET
    return dropRunawaySentences(parts.join(' '), target * REPRESENTATION_LENGTH_MULTIPLIER)
  },
}
