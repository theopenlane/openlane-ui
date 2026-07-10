import { csrfCookieName, csrfHeader, openlaneAPIUrl } from '@repo/dally/auth'
import { getCookie } from './getCookie'

export const jsonContentType = 'application/json'

// secureFetch is a utility function to perform authenticated requests with CSRF protection
export const secureFetch = async (url: string | URL | globalThis.Request, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': jsonContentType,
  }

  let csrfToken = getCookie(csrfCookieName)
  if (!csrfToken) {
    csrfToken = await fetchCSRFToken()
  }

  headers[csrfHeader] = csrfToken
  const newHeaders = appendCookie(headers, csrfCookieName, csrfToken)

  try {
    const res = await fetch(url, {
      ...options,
      headers: newHeaders,
      credentials: 'include',
    })

    const contentType = res.headers.get('content-type')

    // Catch the HTML response issue early
    if (contentType?.includes('text/html')) {
      const html = await res.text()
      console.error('[secureFetch] ❌ Received HTML instead of JSON:', html.slice(0, 200))
      throw new Error('Expected JSON but received HTML')
    }

    return res
  } catch (err) {
    console.error('[secureFetch] ⚠️ Fetch error:', err)
    throw err
  }
}

interface CSRFResponse {
  csrf: string
}

// CSRF tokens are valid for an hour, so cache the fetched token in memory and
// refresh slightly early rather than hitting the rate-limited /csrf endpoint on
// every request. The backend cookie is not readable client-side, so this cache
// is what lets repeat requests reuse a token
const CSRF_TTL_MS = 55 * 60 * 1000
let cachedCSRFToken: string | null = null
let cachedCSRFTokenExpiresAt = 0
let inFlightCSRFRequest: Promise<string> | null = null

export const fetchCSRFToken = async (): Promise<string> => {
  const canCache = typeof window !== 'undefined'

  if (canCache && cachedCSRFToken && Date.now() < cachedCSRFTokenExpiresAt) {
    return cachedCSRFToken
  }

  // Dedupe concurrent callers onto a single in-flight request
  if (canCache && inFlightCSRFRequest) {
    return inFlightCSRFRequest
  }

  const request = (async () => {
    try {
      const res = await fetch(`${openlaneAPIUrl}/csrf`, { credentials: 'include' })
      const contentType = res.headers.get('content-type')

      if (contentType?.includes('text/html')) {
        const html = await res.text()
        console.error('[fetchCSRFToken] ❌ Received HTML instead of JSON:', html.slice(0, 200))
        throw new Error('Expected JSON but received HTML from CSRF endpoint')
      }

      const data: CSRFResponse = await res.json()

      if (!res.ok) {
        console.error('[fetchCSRFToken] ❌ Failed response:', res.status, res.statusText)
        throw new Error(`Failed to fetch CSRF token: ${res.status} ${res.statusText}`)
      }

      if (canCache) {
        cachedCSRFToken = data.csrf
        cachedCSRFTokenExpiresAt = Date.now() + CSRF_TTL_MS
      }

      return data.csrf
    } catch (err) {
      console.error('[fetchCSRFToken] ⚠️ Error fetching CSRF token:', err)
      throw err
    } finally {
      if (canCache) {
        inFlightCSRFRequest = null
      }
    }
  })()

  if (canCache) {
    inFlightCSRFRequest = request
  }

  return request
}

export function appendCookie(headers: Record<string, string>, name: string, value: string): Record<string, string> {
  const existingCookieKey = Object.keys(headers).find((k) => k.toLowerCase() === 'cookie')
  const existingCookie = existingCookieKey ? headers[existingCookieKey] : ''

  const newCookie = `${existingCookie ? existingCookie + '; ' : ''}${name}=${value}`.trim()

  if (existingCookieKey) {
    delete headers[existingCookieKey]
  }

  headers['cookie'] = newCookie
  return headers
}
