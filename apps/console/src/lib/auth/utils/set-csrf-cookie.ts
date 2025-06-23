'use server'

import { csrfCookieName } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setCSRFCookie = async (csrfToken: string) => {
  const cookieStore = await cookies()

  cookieStore.set(`${csrfCookieName}`, csrfToken)
}
