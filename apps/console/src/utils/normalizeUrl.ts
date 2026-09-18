const NAVIGABLE_SCHEMES = ['http://', 'https://']
const EMBEDDABLE_SCHEMES = ['blob:', 'data:']
const KNOWN_SCHEMES = [...NAVIGABLE_SCHEMES, ...EMBEDDABLE_SCHEMES]
const TRAILING_SLASHES = /\/+$/

const startsWithScheme = (url: string, schemes: string[]) => {
  const lower = url.toLowerCase()
  return schemes.some((scheme) => lower.startsWith(scheme))
}

export const normalizeUrl = (url?: string | null) => {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return ''
  return startsWithScheme(trimmed, KNOWN_SCHEMES) ? trimmed : `https://${trimmed}`
}

export const normalizeHref = (url?: string | null) => {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return ''
  if (startsWithScheme(trimmed, NAVIGABLE_SCHEMES)) return trimmed
  if (startsWithScheme(trimmed, EMBEDDABLE_SCHEMES)) return ''
  return `https://${trimmed}`
}

export const formatUrlForDisplay = (url?: string | null) => {
  const normalized = normalizeUrl(url)
  const withoutScheme = normalized.startsWith('https://') ? normalized.slice('https://'.length) : normalized
  return withoutScheme.includes('?') || withoutScheme.includes('#') ? withoutScheme : withoutScheme.replace(TRAILING_SLASHES, '')
}
