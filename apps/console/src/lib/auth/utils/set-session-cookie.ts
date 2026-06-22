'use server'
import { sessionCookieName, sessionCookieExpiration, useInsecureCookies, cookieDomain } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setSessionCookie = async (session: string) => {
  const expirationTime = Number(sessionCookieExpiration) || 60 // default to 60 minutes if not set
  const cookieStore = await cookies()

  const expires = new Date()
  expires.setTime(expires.getTime() + 1000 * 60 * expirationTime)

  if (useInsecureCookies) {
    cookieStore.set(`${sessionCookieName}`, session, {
      expires,
    })
  } else {
    cookieStore.set(`${sessionCookieName}`, session, {
      domain: `${cookieDomain}`,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      expires,
    })
  }
}
