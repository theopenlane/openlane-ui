// Parsing and matching for the docs' example organization controls: turning
// doc bullets into editable rows, and deciding whether a suggestion is really
// a control the org already has. Pure functions, unit tested
import { parseDocBullets } from '@/lib/docs-help/parse'

export type TExistingMatch = { id: string; refCode: string; description?: string | null }

export type TExampleRow = {
  refCode: string
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

// docs list example org controls as "* **A1.1.1** - description" bullets;
// suggestions whose ref code already exists in the org are dropped
export function parseExampleControls(section: string, existingRefCodes: string[] = []): TExampleRow[] {
  const existing = new Set(existingRefCodes.map((code) => code.trim().toLowerCase()))
  return parseDocBullets(section)
    .filter((bullet) => !existing.has(bullet.label.toLowerCase()))
    .map((bullet) => ({ refCode: bullet.label, title: '', description: bullet.description }))
}
