import type { JWT } from '@auth/core/jwt'
import type { Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'

interface SessionTokenUpdate {
  user?: Partial<Pick<Session['user'], 'accessToken' | 'refreshToken' | 'isTfaEnabled' | 'isOnboarding'>>
}

export const applyTokenUpdate = (token: JWT, update: SessionTokenUpdate | undefined): JWT => {
  const next: JWT = { ...token }

  if (typeof update?.user?.isTfaEnabled === 'boolean') {
    next.isTfaEnabled = update.user.isTfaEnabled
  }

  if (typeof update?.user?.isOnboarding === 'boolean') {
    next.isOnboarding = update.user.isOnboarding
  }

  const accessToken = update?.user?.accessToken
  const refreshToken = update?.user?.refreshToken

  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
    return next
  }

  try {
    const { exp } = jwtDecode<{ exp?: number }>(accessToken)

    if (typeof exp !== 'number' || !Number.isFinite(exp) || exp <= 0) {
      console.error('[jwt-token-update] rejected a session update carrying an access token with no usable expiry')
      return next
    }

    if (Date.now() >= exp * 1000) {
      console.error('[jwt-token-update] rejected a session update carrying an already expired access token')
      return next
    }
  } catch {
    console.error('[jwt-token-update] rejected a session update carrying an undecodable access token')
    return next
  }

  return { ...next, accessToken, refreshToken }
}
