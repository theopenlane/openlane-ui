'use server'
import { sessionCookieName, sessionCookieExpiration, isDevelopment, isVercelDev } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setSessionCookie = (session: string): void => {
  const expirationTime = Number(sessionCookieExpiration) || 60 // default to 60 minutes if not set

  const expires = new Date()
  expires.setTime(expires.getTime() + 1000 * 60 * expirationTime)

  // if in development, don't set domain
  if (isDevelopment) {
    cookies().set(`${sessionCookieName}`, session, {
      expires,
    })
  } else if (isVercelDev) {
    cookies().set(`${sessionCookieName}`, session, {
      path: '/',
      httpOnly: true,
      secure: true,
      expires,
    })
  } else {
    cookies().set(`${sessionCookieName}`, session, {
      domain: '.theopenlane.io',
      httpOnly: true,
      secure: true,
      path: '/',
      expires,
    })
  }
}
