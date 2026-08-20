import { stem, textSimilarity, wordSet } from '@/lib/docs-help/example-controls'
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

// vocabulary shared by nearly every security document, so agreeing on it says
// nothing about whether two policies are about the same thing
const GENERIC_SECURITY_WORDS = new Set(['security', 'secure', 'policy', 'polici', 'informat', 'data', 'system', 'user', 'manage', 'manag', 'require', 'establish', 'protect', 'complianc', 'review'])

const distinctiveWords = (value: string) => new Set([...wordSet(value)].filter((word) => !GENERIC_SECURITY_WORDS.has(word)))

// below this there are too few real words left for an overlap ratio to mean anything
const MIN_DISTINCTIVE_WORDS = 3

export const policyCovers = (policy: { name: string; summary?: string | null }, suggestion: { name: string; description?: string | null }) => {
  if (namesMatch(policy.name, suggestion.name)) return true
  if (!policy.summary) return false

  const policyText = `${policy.name} ${policy.summary}`

  // a bare topic gives nothing to compare but its own name, so the policy has to say it
  if (!suggestion.description) {
    const policyWords = new Set(wordTokens(policyText).map(stem))
    const topicWords = identifyingWords(suggestion.name)
    if (topicWords.size === 0 || ![...topicWords].every((word) => policyWords.has(word))) return false
    return textSimilarity(policyText, suggestion.name) >= TOPIC_COVERAGE_THRESHOLD
  }

  const policyWords = distinctiveWords(policyText)
  const topicWords = distinctiveWords(`${suggestion.name} ${suggestion.description}`)
  if (Math.min(policyWords.size, topicWords.size) < MIN_DISTINCTIVE_WORDS) return false

  let shared = 0
  for (const word of topicWords) if (policyWords.has(word)) shared += 1

  // a whole policy document mentions nearly every topic in passing, so this is
  // scored against both sides — dividing by the shorter one lets any long
  // document claim a short topic it merely happens to name
  return (2 * shared) / (policyWords.size + topicWords.size) >= CONTENT_COVERAGE_THRESHOLD
}

// a fuzzy match can pair "Office Security" with the Physical Security topic, so
// name the topic alongside the policy unless the two already read the same
export const coverageNote = (policyName: string, topicName: string) => (namesMatch(policyName, topicName) ? undefined : `covers ${topicName}`)
