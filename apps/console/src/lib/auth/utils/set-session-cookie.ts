'use server'
import { sessionCookieName, sessionCookieExpiration, isDevelopment, isVercelDev, sessionCookieDomain } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setSessionCookie = async (session: string) => {
  const expirationTime = Number(sessionCookieExpiration) || 60 // default to 60 minutes if not set
  const cookieStore = await cookies()

  const expires = new Date()
  expires.setTime(expires.getTime() + 1000 * 60 * expirationTime)

  // if in development, don't set domain
  if (isDevelopment) {
    cookieStore.set(`${sessionCookieName}`, session, {
      expires,
    })
  } else if (isVercelDev) {
    cookieStore.set(`${sessionCookieName}`, session, {
      path: '/',
      httpOnly: true,
      secure: true,
      expires,
    })
  } else {
    cookieStore.set(`${sessionCookieName}`, session, {
      domain: `${sessionCookieDomain}`,
      httpOnly: true,
      secure: true,
      path: '/',
      expires,
    })
  }
}
