'use server'

import { useInsecureCookies } from '@repo/dally/auth'
import { PASSKEY_PROMPT_COOKIE } from '@/lib/auth/constants'
import { cookies } from 'next/headers'

export const setPasskeyCookie = async (userId: string) => {
  const cookieStore = await cookies()

  cookieStore.set(PASSKEY_PROMPT_COOKIE, userId, {
    maxAge: 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: !useInsecureCookies,
  })
}
