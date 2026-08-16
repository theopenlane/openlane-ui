// Turning OL Baseline template controls into editable rows, and deciding
// whether a suggestion is really a control the org already has
import { orgAbbreviation } from '@/utils/strings'
import { OPENLANE_BASELINE_STANDARD } from '@/constants/standards'

export type TExistingMatch = { id: string; refCode: string; description?: string | null }

export type TExampleRow = {
  refCode: string
  // the template's own ref code, which survives the user editing refCode above
  templateRefCode?: string
  title: string
  description: string
  existingMatch?: TExistingMatch
  titleFromAI?: boolean
}

export const isWeakTitle = (title: string, refCode: string) => {
  const trimmed = title.trim()
  return trimmed.length < 4 || trimmed.toLowerCase() === refCode.trim().toLowerCase()
}

export const stem = (word: string) => word.replace(/(ings?|ions?|ments?|ed|es|s)$/, '')

// words that appear in nearly every control description, so counting them
// makes unrelated controls look alike
const FILLER_WORDS = new Set(['control', 'organization', 'organizational', 'ensure', 'process', 'requirement', 'company', 'appropriate', 'relevant', 'must', 'should'])

export const wordSet = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
      .map(stem)
      .filter((word) => !FILLER_WORDS.has(word)),
  )

// overlap coefficient: shared words over the smaller set, so a short existing
// control still matches a longer suggestion describing the same thing
export function textSimilarity(a: string, b: string): number {
  const setA = wordSet(a)
  const setB = wordSet(b)
  if (setA.size === 0 || setB.size === 0) return 0
  let shared = 0
  for (const word of setA) if (setB.has(word)) shared += 1
  return shared / Math.min(setA.size, setB.size)
}

export const SIMILARITY_THRESHOLD = 0.6

// a handful of controls is enough to tell what the org uses
const PREFIX_SAMPLE_SIZE = 10

// The prefix an org already uses for its own controls, e.g. "MS-01.01" -> MS.
// The most common one wins, since a stray code should not redirect the rest
export const existingRefCodePrefix = (refCodes: string[]): string => {
  const counts = new Map<string, number>()
  for (const code of refCodes.slice(0, PREFIX_SAMPLE_SIZE)) {
    const match = /^([A-Za-z0-9]{1,5})-/.exec(code.trim())
    if (!match) continue
    const prefix = match[1].toUpperCase()
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
  }

  let best = ''
  let bestCount = 0
  for (const [prefix, count] of counts) {
    if (count > bestCount) {
      best = prefix
      bestCount = count
    }
  }
  return best
}

// A template control adopted from OL Baseline gets the org's own prefix, so
// "OL-12.06" reads as "AC-12.06" for Acme Corp. What the org already uses wins
// over an abbreviation of its name, and the OL prefix stands when we have neither
export const orgRefCodeFromTemplate = (templateRefCode: string, organizationName?: string | null, existingRefCodes: string[] = []): string => {
  const prefix = existingRefCodePrefix(existingRefCodes) || orgAbbreviation(organizationName)
  if (!prefix) return templateRefCode
  return templateRefCode.replace(new RegExp(`^${OPENLANE_BASELINE_STANDARD.refCodePrefix}`), `${prefix}-`)
}

// A control from the OL Baseline template standard
export type TTemplateControl = { refCode: string; name?: string | null; description?: string | null }

// Seed editable rows from template controls, re-prefixing each ref code to the
// organization. Suggestions the org already has by ref code are dropped
export function templateControlRows(templates: TTemplateControl[], existingRefCodes: string[] = [], organizationName?: string | null, orgRefCodes: string[] = []): TExampleRow[] {
  const existing = new Set(existingRefCodes.map((code) => code.trim().toLowerCase()))
  return templates
    .map((template) => ({
      refCode: orgRefCodeFromTemplate(template.refCode, organizationName, orgRefCodes),
      templateRefCode: template.refCode,
      title: template.name?.trim() ?? '',
      description: template.description?.trim() ?? '',
    }))
    .filter((row) => !existing.has(row.refCode.toLowerCase()))
}
