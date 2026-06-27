import { type NextResponse } from 'next/server'

const ssoOnlyCookieTokens = new Set(['state', 'nonce', 'user_sso', 'token_id', 'token_type', 'organization_id'])

export const supportOnlyCookies = new Set(['support_pending', 'support_state', 'support_nonce', 'support_org', 'support_reason'])

/**
 * Parses a raw Set-Cookie header string and sets allowed cookies on the NextResponse.
 * Only cookies whose names are in allowedCookies are forwarded.
 *
 * @param response - The NextResponse object to set cookies on
 * @param responseCookies - The raw Set-Cookie header string from the upstream response
 * @param allowedCookies - Set of cookie names to allow through
 * @param maxAge - Cookie max age in seconds (default 60)
 */
export function parseAndSetResponseCookies(response: NextResponse, responseCookies: string, allowedCookies: Set<string> = ssoOnlyCookieTokens, maxAge = 60) {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }

  const cookieStrings = responseCookies.split(/,(?=\s*[a-zA-Z0-9_-]+=)/)

  for (const cookieString of cookieStrings) {
    const cookieParts = cookieString.trim().split(';')[0]?.split('=')
    if (cookieParts && cookieParts.length === 2) {
      const [name, value] = cookieParts

      if (allowedCookies.has(name)) {
        response.cookies.set(name, value, {
          ...options,
          // set all cookies to httponly as expected except the organization_id
          // as this will help get rid of the localStorage we use to store the organization_id
          httpOnly: name !== 'organization_id',
        })
      }
    }
  }
}
