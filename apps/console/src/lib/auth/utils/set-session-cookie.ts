'use server'
import { sessionCookieName, sessionCookieDomain, sessionCookieExpiration, useInsecureCookies, cookieDomain } from '@repo/dally/auth'
import { cookies } from 'next/headers'

// Core's sessions.maxage — keep in sync, we overwrite core's own cookie.
const CORE_SESSION_MAX_AGE_SECONDS = 3600 // 1hr

// Login runs server-side, so core's Set-Cookie never reaches the browser and we set it by hand
// from the session value core puts in the body for exactly this. Name, domain and path have to
// match core's: get them wrong and you get a second cookie of the same name, and core reads
// whichever one the browser happens to send first.
export const setSessionCookie = async (session: string) => {
  const configuredMinutes = Number(sessionCookieExpiration)
  const maxAge = configuredMinutes > 0 ? configuredMinutes * 60 : CORE_SESSION_MAX_AGE_SECONDS
  const cookieStore = await cookies()

  if (useInsecureCookies) {
    cookieStore.set(`${sessionCookieName}`, session, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    })

    return
  }

  cookieStore.set(`${sessionCookieName}`, session, {
    domain: sessionCookieDomain || cookieDomain,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge,
  })
}
