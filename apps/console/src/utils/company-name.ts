const LEGAL_SUFFIXES = new Set([
  'inc',
  'incorporated',
  'llc',
  'ltd',
  'limited',
  'corp',
  'corporation',
  'co',
  'company',
  'gmbh',
  'plc',
  'sa',
  'sas',
  'ag',
  'bv',
  'nv',
  'oy',
  'ab',
  'srl',
  'pty',
  'lp',
  'llp',
  'holdings',
])

const nameTokens = (name: string): string[] =>
  name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

export const companyNameKey = (name: string): string => {
  const tokens = nameTokens(name)
  let end = tokens.length
  while (end > 1 && LEGAL_SUFFIXES.has(tokens[end - 1])) end--
  return tokens.length > 0 ? tokens.slice(0, end).join(' ') : name.trim().toLowerCase()
}

export type TBigramProfile = {
  counts: ReadonlyMap<string, number>
  total: number
}

export const bigramProfile = (value: string): TBigramProfile => {
  const counts = new Map<string, number>()
  for (let index = 0; index < value.length - 1; index++) {
    const pair = value.slice(index, index + 2)
    counts.set(pair, (counts.get(pair) ?? 0) + 1)
  }
  return { counts, total: Math.max(value.length - 1, 0) }
}

export const diceSimilarity = (a: TBigramProfile, b: TBigramProfile): number => {
  if (a.total === 0 || b.total === 0) return 0

  let shared = 0
  a.counts.forEach((count, pair) => {
    shared += Math.min(count, b.counts.get(pair) ?? 0)
  })
  return (2 * shared) / (a.total + b.total)
}
