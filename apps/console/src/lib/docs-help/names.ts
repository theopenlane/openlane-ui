import { stem, textSimilarity } from '@/lib/docs-help/example-controls'
import { wordTokens } from '@/utils/strings'

export const normalizeName = (value: string) => wordTokens(value).join(' ')

// words that classify a document rather than identify it, so they shouldn't
// carry weight when deciding whether two policy names mean the same thing
const GENERIC_POLICY_WORDS = new Set(['policy', 'policies', 'standard', 'standards', 'procedure', 'procedures', 'plan', 'plans', 'program', 'management', 'and', 'of', 'the', 'for'])

const NAME_MATCH_THRESHOLD = 0.6

const identifyingWords = (value: string) =>
  new Set(
    wordTokens(value)
      .filter((token) => !GENERIC_POLICY_WORDS.has(token))
      .map(stem),
  )

// Docs and orgs name the same document differently ("Business Continuity Plan"
// vs "Business Continuity and Disaster Recovery (BC/DR)"), so compare the
// identifying words rather than requiring one name to contain the other
export const namesMatch = (a: string, b: string) => {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (na.includes(nb) || nb.includes(na)) return true

  const setA = identifyingWords(a)
  const setB = identifyingWords(b)
  if (setA.size === 0 || setB.size === 0) return false

  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1

  // overlap coefficient, so a broader name still matches the narrower one it covers
  return shared / Math.min(setA.size, setB.size) >= NAME_MATCH_THRESHOLD
}

// an umbrella document often covers a narrower topic without saying so in its
// title ("Office Security" over physical security), so fall back to comparing
// what each one is about
const CONTENT_COVERAGE_THRESHOLD = 0.5
// with only a topic name to go on there are few words to agree on, so demand
// nearly all of them rather than letting one shared word carry the match
const TOPIC_COVERAGE_THRESHOLD = 0.75

export const policyCovers = (policy: { name: string; summary?: string | null }, suggestion: { name: string; description?: string | null }) => {
  if (namesMatch(policy.name, suggestion.name)) return true
  if (!policy.summary) return false

  const threshold = suggestion.description ? CONTENT_COVERAGE_THRESHOLD : TOPIC_COVERAGE_THRESHOLD
  return textSimilarity(`${policy.name} ${policy.summary}`, `${suggestion.name} ${suggestion.description ?? ''}`) >= threshold
}

// a fuzzy match can pair "Office Security" with the Physical Security topic, so
// name the topic alongside the policy unless the two already read the same
export const coverageNote = (policyName: string, topicName: string) => (namesMatch(policyName, topicName) ? undefined : `covers ${topicName}`)
