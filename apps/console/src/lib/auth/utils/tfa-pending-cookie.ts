import { NextResponse } from 'next/server'
import { TFA_PENDING_COOKIE_NAME, TFA_PENDING_MAX_AGE_SECONDS } from './constants'

// host-only (no Domain) so it never reaches other subdomains; set and clear must use the same attributes
// or the browser keeps the cookie, so always go through these helpers
const tfaPendingCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
}

type CookieWriter = {
  set: (name: string, value: string, options: typeof tfaPendingCookieOptions & { maxAge: number }) => unknown
}

// copies only tfa_pending from core's response onto the store as a host-only cookie
export const forwardTfaPendingCookie = (store: CookieWriter, upstreamHeaders: Headers) => {
  const value = new NextResponse(null, { headers: upstreamHeaders }).cookies.get(TFA_PENDING_COOKIE_NAME)?.value

  if (!value) {
    return
  }

  store.set(TFA_PENDING_COOKIE_NAME, value, { ...tfaPendingCookieOptions, maxAge: TFA_PENDING_MAX_AGE_SECONDS })
}

// expires tfa_pending using the same attributes it was set with
export const clearTfaPendingCookie = (store: CookieWriter) => {
  store.set(TFA_PENDING_COOKIE_NAME, '', { ...tfaPendingCookieOptions, maxAge: 0 })
}
