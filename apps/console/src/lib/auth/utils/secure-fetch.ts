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

export const fetchCSRFToken = async (): Promise<string> => {
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

    return data.csrf
  } catch (err) {
    console.error('[fetchCSRFToken] ⚠️ Error fetching CSRF token:', err)
    throw err
  }
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
