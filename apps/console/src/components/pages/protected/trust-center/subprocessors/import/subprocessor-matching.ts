import { bigramProfile, companyNameKey, diceSimilarity, type TBigramProfile } from '@/utils/company-name'

export type TCatalogSubprocessor = {
  id: string
  name: string
  systemOwned: boolean
}

export type TCatalogMatchConfidence = 'exact' | 'normalized' | 'suggested'

export type TCatalogMatch = {
  subprocessor: TCatalogSubprocessor
  confidence: TCatalogMatchConfidence
}

const MIN_ACRONYM_LENGTH = 2
const MIN_CONTAINED_TOKEN_LENGTH = 3
const MIN_SIMILARITY = 0.8
const MIN_SIMILARITY_MARGIN = 0.1

const compact = (key: string): string => key.replaceAll(' ', '')

const initials = (key: string): string => {
  const tokens = key.split(' ').filter(Boolean)
  return tokens.length >= MIN_ACRONYM_LENGTH ? tokens.map((token) => token[0]).join('') : ''
}

type TIndexedSubprocessor = TCatalogSubprocessor & { compactKey: string; tokens: Set<string>; profile: TBigramProfile }

type TCatalogIndex = {
  byName: Map<string, TIndexedSubprocessor[]>
  byCompactKey: Map<string, TIndexedSubprocessor[]>
  byInitials: Map<string, TIndexedSubprocessor[]>
  entries: TIndexedSubprocessor[]
}

const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  if (!key) return
  const existing = map.get(key)
  if (existing) existing.push(value)
  else map.set(key, [value])
}

export const buildCatalogIndex = (catalog: TCatalogSubprocessor[]): TCatalogIndex => {
  const index: TCatalogIndex = { byName: new Map(), byCompactKey: new Map(), byInitials: new Map(), entries: [] }

  catalog.forEach((subprocessor) => {
    const key = companyNameKey(subprocessor.name)
    const compactKey = compact(key)
    const entry: TIndexedSubprocessor = { ...subprocessor, compactKey, tokens: new Set(key.split(' ').filter(Boolean)), profile: bigramProfile(compactKey) }
    index.entries.push(entry)
    push(index.byName, subprocessor.name.trim().toLowerCase(), entry)
    push(index.byCompactKey, compactKey, entry)
    push(index.byInitials, initials(key), entry)
  })

  return index
}

const preferSystemOwned = (candidates: TIndexedSubprocessor[]): TIndexedSubprocessor => candidates.find((candidate) => candidate.systemOwned) ?? candidates[0]

type TScored = { entry: TIndexedSubprocessor; score: number }

const onlyCandidate = (entries: TIndexedSubprocessor[]): TIndexedSubprocessor | undefined =>
  entries.length > 0 && new Set(entries.map((entry) => entry.compactKey)).size === 1 ? preferSystemOwned(entries) : undefined

const clearWinner = (scored: TScored[]): TIndexedSubprocessor | undefined => {
  const byKey = new Map<string, TScored>()
  scored.forEach((candidate) => {
    const current = byKey.get(candidate.entry.compactKey)
    if (!current || candidate.score > current.score) byKey.set(candidate.entry.compactKey, candidate)
  })
  const [best, runnerUp] = [...byKey.values()].sort((a, b) => b.score - a.score)
  if (!best || (runnerUp && best.score - runnerUp.score < MIN_SIMILARITY_MARGIN)) return undefined
  return onlyCandidate(scored.filter(({ entry }) => entry.compactKey === best.entry.compactKey).map(({ entry }) => entry))
}

const isContainedMatch = (tokens: Set<string>, entry: TIndexedSubprocessor): boolean => {
  const [smaller, larger] = tokens.size <= entry.tokens.size ? [tokens, entry.tokens] : [entry.tokens, tokens]
  if (smaller.size === 0 || smaller.size === larger.size) return false
  const smallerTokens = [...smaller]
  return smallerTokens.join('').length >= MIN_CONTAINED_TOKEN_LENGTH && smallerTokens.every((token) => larger.has(token))
}

export const matchCatalogSubprocessor = (name: string, index: TCatalogIndex): TCatalogMatch | null => {
  const exact = index.byName.get(name.trim().toLowerCase())
  if (exact) return { subprocessor: preferSystemOwned(exact), confidence: 'exact' }

  const key = companyNameKey(name)
  const compactKey = compact(key)
  if (!compactKey) return null

  const normalized = index.byCompactKey.get(compactKey)
  if (normalized) return { subprocessor: preferSystemOwned(normalized), confidence: 'normalized' }

  const ownInitials = initials(key)
  const acronym = onlyCandidate([...(index.byInitials.get(compactKey) ?? []), ...(ownInitials ? (index.byCompactKey.get(ownInitials) ?? []) : [])])
  if (acronym) return { subprocessor: acronym, confidence: 'suggested' }

  const tokens = new Set(key.split(' ').filter(Boolean))
  const containing = index.entries.filter((entry) => isContainedMatch(tokens, entry))
  if (containing.length > 0) {
    const contained = onlyCandidate(containing)
    return contained ? { subprocessor: contained, confidence: 'suggested' } : null
  }

  const profile = bigramProfile(compactKey)
  const similar = clearWinner(index.entries.map((entry) => ({ entry, score: diceSimilarity(profile, entry.profile) })).filter(({ score }) => score >= MIN_SIMILARITY))
  return similar ? { subprocessor: similar, confidence: 'suggested' } : null
}
