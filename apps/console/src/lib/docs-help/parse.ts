// Pure parsing of retrieved doc chunks and page markdown — no network and no
// clients, so everything here is unit testable
import type { DocsHelpChunk } from '@/types/docs-help'
import type { DocsPolicyMappingRow } from '@/lib/docs-help/types'
import { toHumanLabel } from '@/utils/strings'

// titles too generic to identify a page on their own
const GENERIC_TITLES = /^(overview|introduction|faq|getting started|index)$/i

// doc sections list examples as "* **Label** - description", whatever the object
const DOC_BULLET = /^[*-]\s+\*\*(.+?)\*\*\s*[-–—]\s*(.+)$/gm

export type DocBullet = { label: string; description: string }

// Prefix a generic page title with its parent section, so results are distinguishable
export const qualifyTitle = (title: string, source: string): string => {
  if (!GENERIC_TITLES.test(title) || !source) return title
  try {
    const segments = new URL(source).pathname.split('/').filter(Boolean)
    const parent = segments[segments.length - 2]
    if (!parent || ['docs', 'platform', 'developers'].includes(parent)) return title
    const parentTitle = toHumanLabel(parent)
    return `${parentTitle} ${title}`
  } catch {
    return title
  }
}

// True for the site or docs root, which is never a useful result
export const isDocsHomepage = (source: string): boolean => {
  if (!source) return false
  try {
    const path = new URL(source).pathname.replace(/\/+$/, '')
    return path === '' || path === '/docs'
  } catch {
    return false
  }
}

// Unwrap inline links and drop bold markers, leaving the readable text tags out
export const htmlToText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const stripInlineMarkdown = (value: string): string =>
  value
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim()

// Read a doc section's example bullets into label/description pairs
export const parseDocBullets = (section: string): DocBullet[] =>
  [...section.matchAll(DOC_BULLET)].map((match) => ({ label: stripInlineMarkdown(match[1]), description: stripInlineMarkdown(match[2]) }))

// Pull one named section out of a page, trying headings in the caller's order
export const extractMarkdownSection = (md: string, headings: string | string[]): string | null => {
  const names = (Array.isArray(headings) ? headings : [headings]).map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  let start: RegExpExecArray | null = null
  for (const name of names) {
    start = new RegExp(`^##+\\s+.*${name}.*$`, 'im').exec(md)
    if (start) break
  }
  if (!start) return null
  const body = md.slice(start.index + start[0].length)
  // any heading ends the section, including a higher-level one
  const next = /^#{1,6}\s/m.exec(body)
  return body.slice(0, next ? next.index : undefined).trim() || null
}

// Read the docs' policy-to-framework table into rows, skipping header and divider
export const parsePolicyMappingTable = (md: string): DocsPolicyMappingRow[] => {
  const rows: DocsPolicyMappingRow[] = []
  for (const match of md.matchAll(/^\|([^|\n]+)\|([^|\n]+)\|\s*$/gm)) {
    const policy = stripInlineMarkdown(match[1])
    const frameworksCell = stripInlineMarkdown(match[2])
    if (!policy || /^-+$/.test(policy.replace(/[\s:]/g, '')) || /^policy$/i.test(policy)) continue
    rows.push({
      policy,
      frameworks: /^all$/i.test(frameworksCell)
        ? ['all']
        : frameworksCell
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean),
    })
  }
  return rows
}

// True when retrieval cut the text off mid-thought, so the page has more to show
export const looksTruncated = (text: string): boolean => {
  const trimmed = text.trim()
  if (!trimmed) return false
  const lastLine = trimmed.split('\n').pop()?.trim() ?? ''
  // a numbered/bulleted marker with no content after it
  if (/^(\d+[.)]|[-*+])$/.test(lastLine)) return true
  return !/[.!?:;)\]}"'`|]$/.test(trimmed)
}

// Split a retrieved chunk into its title, source and body
export const parseChunk = (raw: string): DocsHelpChunk => {
  const rawTitle = (raw.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? '').replace(/\s*\|\s*Openlane\s*$/, '')
  const source = raw.match(/^Source:\s*(\S+)$/m)?.[1]?.trim() ?? ''
  const title = qualifyTitle(rawTitle, source)
  const text = raw
    .replace(/^Title:.*$/m, '')
    .replace(/^Source:.*$/m, '')
    .replace(/!\[[^\]]*\]\(\S*\)?/g, '')
    .trim()
  return { title, source, text, truncated: looksTruncated(text) }
}

// Keep one chunk per source page, dropping the docs homepage
export const dedupeBySource = (raw: (string | null | undefined)[]): DocsHelpChunk[] => {
  const seen = new Set<string>()
  const chunks: DocsHelpChunk[] = []
  for (const text of raw) {
    if (!text) continue
    const parsed = parseChunk(text)
    if (isDocsHomepage(parsed.source)) continue
    const key = parsed.source || parsed.text.slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    chunks.push(parsed)
  }
  return chunks
}

// Order chunks by an explicit page hint first, then by the console area in view
export const rankChunks = (chunks: DocsHelpChunk[], prefer: string | undefined, section: string | undefined): DocsHelpChunk[] => {
  const preferred = prefer?.toLowerCase() ?? ''
  const biasPath = section === 'developers' ? '/docs/developers/' : '/docs/platform/'
  const scoreOf = (chunk: DocsHelpChunk) => {
    let score = 0
    if (preferred && (chunk.title.toLowerCase().includes(preferred) || chunk.source.toLowerCase().includes(preferred))) score += 4
    if (chunk.source.includes(biasPath)) score += 2
    return score
  }
  return chunks
    .map((chunk) => ({ chunk, score: scoreOf(chunk) }))
    .sort((a, b) => b.score - a.score)
    .map(({ chunk }) => chunk)
}
