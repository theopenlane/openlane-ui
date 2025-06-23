'use server'

import { csrfCookieName, isDevelopment } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setCSRFCookie = async (csrfToken: string) => {
  const cookieStore = await cookies()

  console.log('Setting CSRF cookie:', csrfToken)

  if (isDevelopment) {
    cookieStore.set(`${csrfCookieName}`, csrfToken, {
      sameSite: 'lax',
      secure: false,
      path: '/',
    })
  } else {
    cookieStore.set(`${csrfCookieName}`, csrfToken, {
      sameSite: 'none',
      secure: true,
      path: '/',
    })
  }
}
