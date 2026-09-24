export const canonicalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const canonicalizeLookupValue = (value?: string | null) => value?.trim().toLowerCase() || ''

export const sanitizeEntityName = (value: string) => value.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || canonicalizeEntityName(value)
