import { csrfCookieName, csrfHeader, openlaneAPIUrl } from '@repo/dally/auth'
import { getCookie } from './getCookie'

export const jsonContentType = 'application/json'

// secureFetch is a utility function to perform authenticated requests with CSRF protection
// It retrieves the current session, fetches a CSRF token if not present, and includes it in the request headers
// It also sets the Content-Type to application/json by default
export const secureFetch = async (url: string, options: RequestInit = {}) => {
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
  headers['Cookie'] = `${csrfCookieName}=${csrfToken}` // Forward the CSRF token in the cookie

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

interface CSRFResponse {
  csrf: string
}

export const fetchCSRFToken = async (): Promise<string> => {
  const res: Response = await fetch(`${openlaneAPIUrl}/csrf`, { credentials: 'include' })
  const data: CSRFResponse = await res.json()

  return data.csrf
}
