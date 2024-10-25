'use server'
import { sessionCookieName, sessionCookieExpiration } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setSessionCookie = (session: string): void => {
  const expirationTime = Number(sessionCookieExpiration) || 60 // default to 60 minutes if not set

  const expires = new Date()
  expires.setTime(expires.getTime() + 1000 * 60 * expirationTime)

  if (process.env.NODE_ENV === 'production') {
    cookies().set(`${sessionCookieName}`, session, {
      domain: '.theopenlane.io',
      httpOnly: true,
      secure: true,
      path: '/',
      expires,
    })
  } else {
    cookies().set(`${sessionCookieName}`, session, {
      expires,
    })
  }
}
