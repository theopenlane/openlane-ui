import 'server-only'
import { cookies } from 'next/headers'
import { type Session } from 'next-auth'
import { sessionCookieName } from '@repo/dally/auth'
import { auth } from '@/lib/auth/auth'

export type TServerCredentials = {
  session: Session
  accessToken: string
  sessionCookie: string
}

export const getServerCredentials = async (): Promise<TServerCredentials | null> => {
  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const accessToken = session?.user?.accessToken
  const sessionCookie = cookieStore.get(sessionCookieName as string)?.value

  if (!session || !accessToken || !sessionCookie) {
    return null
  }

  return { session, accessToken, sessionCookie }
}
