'use server'
import { sessionCookieName, sessionCookieExpiration, isDevelopment, isVercelDev } from '@repo/dally/auth'
import { cookies, type UnsafeUnwrappedCookies } from 'next/headers'

export const setSessionCookie = async (session: string): void => {
  const expirationTime = Number(sessionCookieExpiration) || 60 // default to 60 minutes if not set

  const expires = new Date()
  expires.setTime(expires.getTime() + 1000 * 60 * expirationTime)

  // if in development, don't set domain
  if (isDevelopment) {
    ;(cookies() as unknown as UnsafeUnwrappedCookies).set(`${sessionCookieName}`, session, {
      expires,
    })
  } else if (isVercelDev) {
    ;(cookies() as unknown as UnsafeUnwrappedCookies).set(`${sessionCookieName}`, session, {
      path: '/',
      httpOnly: true,
      secure: true,
      expires,
    })
  } else {
    ;(cookies() as unknown as UnsafeUnwrappedCookies).set(`${sessionCookieName}`, session, {
      domain: '.theopenlane.io',
      httpOnly: true,
      secure: true,
      path: '/',
      expires,
    })
  }
}
