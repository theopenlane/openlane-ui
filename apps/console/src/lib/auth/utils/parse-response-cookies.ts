import { NextResponse } from 'next/server'

const ssoOnlyCookieTokens = new Set(['state', 'nonce', 'user_sso', 'token_id', 'token_type', 'organization_id'])

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
  maxAge?: number
  expires?: Date
  domain?: string
}

export interface CookieStore {
  set(name: string, value: string, options?: CookieOptions): void
}

export function parseSSOCookies(responseCookies: string, cookieStore: CookieStore) {
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
      if (ssoOnlyCookieTokens.has(name)) {
        cookieStore.set(name, value, {
          ...options,
          // set all cookies to httponly as expected except the organization_id
          // as this will help get rid of the localStorage we use to store the organization_id
          httpOnly: name !== 'organization_id',
        })
      }
    }
  }
}

/**
 * parses response cookies and sets them on the NextResponse object
 *  sets cookies that are in the allowedTokens set
 *
 * @param response - The NextResponse object to set cookies on
 * @param responseCookies - The raw cookie string from the response headers
 */
export function parseAndSetResponseCookies(response: NextResponse, responseCookies: string) {
  parseSSOCookies(responseCookies, response.cookies)
}
