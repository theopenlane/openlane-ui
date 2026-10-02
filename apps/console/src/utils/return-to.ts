import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'

export const RETURN_TO_PARAM = 'returnTo'

const URL_BASE = 'http://localhost'

export const currentLocationPath = (): string => `${window.location.pathname}${window.location.search}`

export const withReturnTo = (href: string, returnTo?: string | null): string => {
  if (!returnTo) return href
  const url = new URL(href, URL_BASE)
  const origin = new URL(returnTo, URL_BASE)
  const effectiveReturnTo = origin.pathname === url.pathname ? origin.searchParams.get(RETURN_TO_PARAM) : returnTo
  if (!effectiveReturnTo) return href
  url.searchParams.set(RETURN_TO_PARAM, effectiveReturnTo)
  return `${url.pathname}${url.search}${url.hash}`
}

export const readReturnTo = (searchParams: Pick<URLSearchParams, 'get'>, fallback: string): string => sanitizeLoginRedirect(searchParams.get(RETURN_TO_PARAM), fallback)
