'use server'

import { cookieDomain, csrfCookieName, isDevelopment } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setCSRFCookie = async (csrfToken: string) => {
  const cookieStore = await cookies()

  if (isDevelopment) {
    cookieStore.set(`${csrfCookieName}`, csrfToken, {
      sameSite: 'lax',
      secure: false,
      path: '/',
    })
  } else {
    cookieStore.set(`${csrfCookieName}`, csrfToken, {
      domain: `${cookieDomain}`,
      sameSite: 'none',
      secure: true,
      path: '/',
    })
  }
}

export const getCSRFCookie = async (cookies: string | null): Promise<string | undefined> => {
  if (!cookies) return undefined

  const cookieArray = cookies.split('; ')
  for (const cookie of cookieArray) {
    if (cookie.startsWith(`${csrfCookieName}=`)) {
      return cookie.split('=')[1]
    }
  }

  return undefined
}
