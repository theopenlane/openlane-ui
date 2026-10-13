const NAVIGABLE_SCHEMES = ['http://', 'https://']
const EMBEDDABLE_SCHEMES = ['blob:', 'data:']
const KNOWN_SCHEMES = [...NAVIGABLE_SCHEMES, ...EMBEDDABLE_SCHEMES]
const TRAILING_SLASHES = /\/+$/
const MAX_URL_LENGTH = 2048
const URL_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+\.?$/i
const URL_AUTHORITY = /^https?:\/\/([^/?#]*)/i
const CONTROL_CHARACTER = /\p{Cc}/u
const PROTOCOL_RELATIVE_PREFIX = '//'

const startsWithScheme = (url: string, schemes: string[]) => {
  const lower = url.toLowerCase()
  return schemes.some((scheme) => lower.startsWith(scheme))
}

const withHttpsScheme = (url: string) => (url.startsWith(PROTOCOL_RELATIVE_PREFIX) ? `https:${url}` : `https://${url}`)

export const normalizeUrl = (url?: string | null) => {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return ''
  return startsWithScheme(trimmed, KNOWN_SCHEMES) ? trimmed : withHttpsScheme(trimmed)
}

export const normalizeHref = (url?: string | null) => {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return ''
  if (startsWithScheme(trimmed, NAVIGABLE_SCHEMES)) return trimmed
  if (startsWithScheme(trimmed, EMBEDDABLE_SCHEMES)) return ''
  return withHttpsScheme(trimmed)
}

export const toValidHref = (url?: string | null) => {
  const href = normalizeHref(url)
  if (!href) return ''

  try {
    return new URL(href).href
  } catch {
    return ''
  }
}

export const formatUrlForDisplay = (url?: string | null) => {
  const normalized = normalizeUrl(url)
  const withoutScheme = normalized.startsWith('https://') ? normalized.slice('https://'.length) : normalized
  return withoutScheme.includes('?') || withoutScheme.includes('#') ? withoutScheme : withoutScheme.replace(TRAILING_SLASHES, '')
}

export const toHostname = (url?: string | null) => {
  const normalized = normalizeUrl(url)
  if (!normalized) return ''

  try {
    return new URL(normalized).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export const isValidUrl = (url?: string | null) => {
  const trimmed = url?.trim() ?? ''
  const href = normalizeHref(trimmed)
  if (!href || trimmed.length > MAX_URL_LENGTH || CONTROL_CHARACTER.test(href)) return false

  const authority = URL_AUTHORITY.exec(href)?.[1] ?? ''
  return URL_HOST.test(authority.slice(authority.lastIndexOf('@') + 1)) && URL.canParse(href)
}
