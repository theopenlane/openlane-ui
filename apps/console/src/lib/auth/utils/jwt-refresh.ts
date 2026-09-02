import type { JWT } from '@auth/core/jwt'
import type { Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { fetchNewAccessToken, type RefreshResult } from './refresh-token'
import { isTokenUsable } from './session-tokens'

const SUCCESS_CACHE_MS = 5 * 60_000
const FAILURE_CACHE_MS = 30_000
const MAX_CACHED_REFRESHES = 32

interface CachedRefresh {
  result: Promise<RefreshResult>
  expiresAt: number
}

interface SessionTokenUpdate {
  user?: Partial<Pick<Session['user'], 'accessToken' | 'refreshToken' | 'isTfaEnabled' | 'isOnboarding'>>
}

const cache = new Map<string, CachedRefresh>()

const prune = (now: number) => {
  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) {
      cache.delete(key)
    }
  }

  while (cache.size > MAX_CACHED_REFRESHES) {
    const oldest = cache.keys().next()

    if (oldest.done) {
      break
    }

    cache.delete(oldest.value)
  }
}

export const withFreshAccessToken = async (token: JWT): Promise<JWT | null> => {
  const { accessToken, refreshToken } = token

  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
    return token
  }

  if (isTokenUsable(accessToken)) {
    return token
  }

  const now = Date.now()

  prune(now)

  const reused = cache.get(refreshToken)
  const pending = reused?.result ?? fetchNewAccessToken(refreshToken)

  if (!reused) {
    const entry: CachedRefresh = { result: pending, expiresAt: now + FAILURE_CACHE_MS }
    cache.set(refreshToken, entry)

    void pending.then(
      (settled) => {
        entry.expiresAt = Date.now() + (settled.status === 'ok' ? SUCCESS_CACHE_MS : FAILURE_CACHE_MS)
      },
      () => {
        cache.delete(refreshToken)
      },
    )
  }

  let outcome: RefreshResult

  try {
    outcome = await pending
  } catch (error) {
    console.error('[jwt-refresh] refreshing the session access token threw:', error)
    return token
  }

  if (outcome.status === 'ok') {
    return { ...token, accessToken: outcome.tokens.accessToken, refreshToken: outcome.tokens.refreshToken }
  }

  if (outcome.status === 'rejected') {
    console.error('[jwt-refresh] the refresh token was rejected, ending the session')
    return null
  }

  console.error('[jwt-refresh] could not refresh the session access token:', outcome.status)

  return token
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

    if (exp && Date.now() >= exp * 1000) {
      console.error('[jwt-refresh] rejected a session update carrying an already expired access token')
      return next
    }
  } catch {
    console.error('[jwt-refresh] rejected a session update carrying an undecodable access token')
    return next
  }

  return { ...next, accessToken, refreshToken }
}
