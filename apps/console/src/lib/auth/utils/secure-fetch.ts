import { csrfCookieName, csrfHeader, openlaneAPIUrl } from '@repo/dally/auth'
import { getCookie } from './getCookie'

export const jsonContentType = 'application/json'

// secureFetch is a utility function to perform authenticated requests with CSRF protection
export interface SecureFetchCSRFOptions {
  token?: string
}

const CSRF_EXEMPT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

const resolveMethod = (url: string | URL | globalThis.Request, options: RequestInit): string => (options.method ?? (url instanceof Request ? url.method : 'GET')).toUpperCase()

export const isCSRFRejection = async (response: Response): Promise<boolean> => {
  if (response.status !== 403) {
    return false
  }

  try {
    return (await response.clone().text()).toLowerCase().includes('csrf')
  } catch {
    return false
  }
}

export const secureFetch = async (url: string | URL | globalThis.Request, options: RequestInit = {}, csrfOptions: SecureFetchCSRFOptions = {}) => {
  const baseHeaders: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': jsonContentType,
  }

  const send = async (csrfToken: string) => {
    const headers = appendCookie({ ...baseHeaders, [csrfHeader]: csrfToken }, csrfCookieName, csrfToken)

    const res = await fetch(url, {
      ...options,
      headers,
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
  }

  let csrfToken = csrfOptions.token ?? getCookie(csrfCookieName)
  if (!csrfToken) {
    csrfToken = await fetchCSRFToken()
  }

  try {
    const response = await send(csrfToken)

    if (!csrfOptions.token && !CSRF_EXEMPT_METHODS.has(resolveMethod(url, options)) && (await isCSRFRejection(response))) {
      console.warn('[secureFetch] ⚠️ CSRF token rejected — refetching and retrying once')
      invalidateCSRFToken()

      return await send(await fetchCSRFToken())
    }

    return response
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

export const invalidateCSRFToken = () => {
  cachedCSRFToken = null
  cachedCSRFTokenExpiresAt = 0
}

export const fetchCSRFToken = async (): Promise<string> => {
  const canCache = typeof window !== 'undefined'

  if (canCache && cachedCSRFToken && Date.now() < cachedCSRFTokenExpiresAt) {
    return cachedCSRFToken
  }

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

      if (!res.ok) {
        console.error('[fetchCSRFToken] ❌ Failed response:', res.status, res.statusText)
        throw new Error(`Failed to fetch CSRF token: ${res.status} ${res.statusText}`)
      }

      const data: CSRFResponse = await res.json()

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

export const appendCookie = (headers: Record<string, string>, name: string, value: string): Record<string, string> => {
  const existingCookieKey = Object.keys(headers).find((k) => k.toLowerCase() === 'cookie')
  const existingCookie = existingCookieKey ? headers[existingCookieKey] : ''

  const otherCookies = existingCookie
    .split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie !== '' && !cookie.startsWith(`${name}=`))

  if (existingCookieKey) {
    delete headers[existingCookieKey]
  }

  headers['cookie'] = [...otherCookies, `${name}=${value}`].join('; ')
  return headers
}
