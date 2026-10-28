'use server'

import { useInsecureCookies } from '@repo/dally/auth'
import { cookies } from 'next/headers'

export const setPasskeyCookie = async () => {
  const cookieStore = await cookies()

  cookieStore.set('passkey-prompt', 'true', {
    maxAge: 5 * 60,
    path: '/',
    sameSite: 'lax',
    secure: !useInsecureCookies,
  })
}
