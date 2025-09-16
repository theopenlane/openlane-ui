import { NextResponse } from 'next/server'

const ssoOnlyCookieTokens = new Set(['state', 'nonce', 'user_sso', 'token_id', 'token_type', 'organization_id'])

/**
 * parses response cookies and sets them on the NextResponse object
 *  sets cookies that are in the allowedTokens set
 *
 * @param response - The NextResponse object to set cookies on
 * @param responseCookies - The raw cookie string from the response headers
 * @param allowedTokens - Set of token names that are allowed to be set as cookies
 */
export function parseAndSetResponseCookies(response: NextResponse, responseCookies: string) {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60,
  }

  const cookieStrings = responseCookies.split(/,(?=\s*[a-zA-Z0-9_-]+=)/)

  for (const cookieString of cookieStrings) {
    const cookieParts = cookieString.trim().split(';')[0]?.split('=')
    if (cookieParts && cookieParts.length === 2) {
      const [name, value] = cookieParts

      // set cookies that are in the allowedTokens set
      if (!ssoOnlyCookieTokens.has(name)) {
        continue
      }

      response.cookies.set(name, value, options)
    }
  }
}
