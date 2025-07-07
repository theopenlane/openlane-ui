import { csrfCookieName, csrfHeader, openlaneAPIUrl } from '@repo/dally/auth'
import { getCookie } from './getCookie'
export const jsonContentType = 'application/json'

// secureFetch is a utility function to perform authenticated requests with CSRF protection
// It retrieves the current session, fetches a CSRF token if not present, and includes it in the request headers
// It also sets the Content-Type to application/json by default
export const secureFetch = async (url: string | URL | globalThis.Request, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    'Content-Type': jsonContentType,
  }

  let csrfToken = getCookie(csrfCookieName)
  if (!csrfToken) {
    // If CSRF token is not found in cookies, fetch a new one
    csrfToken = await fetchCSRFToken()
  }

  headers[csrfHeader] = csrfToken // Ensure CSRF token is in the headers
  const newHeaders = appendCookie(headers, csrfCookieName, csrfToken)

  return fetch(url, {
    ...options,
    headers: newHeaders,
    credentials: 'include',
  })
}

interface CSRFResponse {
  csrf: string
}

export const fetchCSRFToken = async (): Promise<string> => {
  const res: Response = await fetch(`${openlaneAPIUrl}/csrf`, { credentials: 'include' })
  const data: CSRFResponse = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token: ${res.status} ${res.statusText}`)
  }

  return data.csrf
}

export function appendCookie(headers: Record<string, string>, name: string, value: string): Record<string, string> {
  // Normalize existing header keys to lowercase to find any variant of "cookie"
  const existingCookieKey = Object.keys(headers).find((k) => k.toLowerCase() === 'cookie')
  const existingCookie = existingCookieKey ? headers[existingCookieKey] : ''

  // Build the new cookie string
  const newCookie = `${existingCookie ? existingCookie + '; ' : ''}${name}=${value}`.trim()

  // Remove the old cookie header (regardless of casing)
  if (existingCookieKey) {
    delete headers[existingCookieKey]
  }

  // Set with standard casing
  headers['cookie'] = newCookie

  return headers
}
