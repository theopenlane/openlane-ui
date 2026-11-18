import { NextResponse } from 'next/server'
import { cookieDomain, useInsecureCookies } from '@repo/dally/auth'
import { TFA_PENDING_COOKIE_NAME, TFA_PENDING_MAX_AGE_SECONDS } from './constants'

// host-only (no Domain) so it never reaches other subdomains; set and clear must use the same attributes
// or the browser keeps the cookie, so always go through these helpers
const tfaPendingCookieOptions = {
  httpOnly: true,
  secure: !useInsecureCookies,
  sameSite: 'lax' as const,
  path: '/',
}

// so we do not have to keep extending the custom type
type CookieWriter = Pick<NextResponse['cookies'], 'set'>

export const forwardTfaPendingCookie = (store: CookieWriter, upstreamHeaders: Headers, accessToken?: string) => {
  if (accessToken) {
    store.set('access_token', accessToken, {
      ...tfaPendingCookieOptions,
      sameSite: useInsecureCookies ? 'lax' : 'none',
      domain: useInsecureCookies ? undefined : cookieDomain,
      maxAge: TFA_PENDING_MAX_AGE_SECONDS,
    })
    return
  }

  const value = new NextResponse(null, { headers: upstreamHeaders }).cookies.get(TFA_PENDING_COOKIE_NAME)?.value

  if (!value) {
    return
  }

  store.set(TFA_PENDING_COOKIE_NAME, value, { ...tfaPendingCookieOptions, maxAge: TFA_PENDING_MAX_AGE_SECONDS })
}

// expires cookies using the same attributes they were set with
export const clearTfaPendingCookie = (store: CookieWriter, clearAccessToken = false) => {
  store.set(TFA_PENDING_COOKIE_NAME, '', { ...tfaPendingCookieOptions, maxAge: 0 })
  if (clearAccessToken) {
    store.set('access_token', '', {
      ...tfaPendingCookieOptions,
      sameSite: useInsecureCookies ? 'lax' : 'none',
      domain: useInsecureCookies ? undefined : cookieDomain,
      maxAge: 0,
    })
  }
}
