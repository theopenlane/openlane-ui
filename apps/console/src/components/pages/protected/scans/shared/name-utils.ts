export const canonicalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const canonicalizeLookupValue = (value?: string | null) => value?.trim().toLowerCase() || ''

export const sanitizeEntityName = (value: string) => value.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || canonicalizeEntityName(value)

const LEGAL_SUFFIXES = new Set(['inc', 'incorporated', 'llc', 'ltd', 'limited', 'corp', 'corporation', 'co', 'gmbh', 'plc', 'ag', 'sa', 'bv'])

const PARENTHETICAL = /\(([^)]*)\)/g

const compactCompanyName = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !LEGAL_SUFFIXES.has(word))
    .join('')

export const companyNameKeys = (...names: (string | undefined)[]): string[] => [
  ...new Set(
    names
      .filter((name): name is string => !!name)
      .flatMap((name) => [name.replace(PARENTHETICAL, ' '), ...[...name.matchAll(PARENTHETICAL)].map((match) => match[1])])
      .map(compactCompanyName)
      .filter(Boolean),
  ),
]
