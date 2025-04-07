import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import { fetchNewAccessToken } from './refresh-token'

function isTokenExpired(accessToken?: string): boolean {
  if (!accessToken) return true
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return payload.exp ? Date.now() >= payload.exp * 1000 : true
  } catch (err) {
    console.error('Error decoding token:', err)
    return true
  }
}

export async function ensureAuth(session: Session | null): Promise<string | null> {
  if (!session) {
    return null
  }

  let accessToken = session.user?.accessToken
  const refreshToken = session.user?.refreshToken

  if (isTokenExpired(accessToken) && refreshToken) {
    try {
      const newTokens = await fetchNewAccessToken(refreshToken)
      if (!newTokens || !newTokens.accessToken) {
        throw new Error('Token refresh failed')
      }
      session.user.accessToken = newTokens.accessToken
      session.user.refreshToken = newTokens.refreshToken
      accessToken = newTokens.accessToken
    } catch (err) {
      console.error('Token refresh error:', err)
      await signOut()
      return null
    }
  }

  if (!accessToken) {
    await signOut()
    return null
  }

  return accessToken
}
