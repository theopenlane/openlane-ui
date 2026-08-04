'use client'

import { fetchNewAccessToken } from './refresh-token'
import { probeSession, SessionUnavailableError } from './session-health'
import { notifySessionExpired } from './session-status'
import { getKnownTokens, getTokenGeneration, setAuthoritativeTokens, type TokenState } from './session-tokens'

// Web Locks key, not a duration. The lock namespace is per-origin and shared across tabs, so an
// exclusive hold means five open tabs produce one /v1/refresh instead of five. The name is a
// browser-global string, hence the openlane- prefix. Serializing is only half the job: the
// generation check inside the lock is what makes queued waiters adopt the winner's tokens
// instead of minting their own. Degrades to an unsynchronized run() where locks are unavailable.
const SESSION_REFRESH_LOCK = 'openlane-session-refresh'

type TokenPersister = (tokens: { accessToken: string; refreshToken: string }) => Promise<unknown>

let persistTokens: TokenPersister | null = null

export const setTokenPersister = (persist: TokenPersister | null) => {
  persistTokens = persist
}

const withRefreshLock = async <T>(run: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request(SESSION_REFRESH_LOCK, { mode: 'exclusive' }, run)
  }

  return run()
}

export const refreshTokens = async (refreshToken: string): Promise<TokenState> => {
  const observedGeneration = getTokenGeneration()

  return withRefreshLock(async () => {
    const superseded = getKnownTokens()

    if (superseded && getTokenGeneration() !== observedGeneration) {
      return superseded
    }

    const probe = await probeSession({ maxAgeMs: 0 })

    if (probe.status === 'unavailable') {
      throw new SessionUnavailableError(probe.retryAfterMs)
    }

    if (probe.status === 'signed-out') {
      notifySessionExpired()
      throw new Error('Session expired')
    }

    const cookieAccessToken = probe.session.user?.accessToken
    const cookieRefreshToken = probe.session.user?.refreshToken

    if (cookieAccessToken && cookieRefreshToken && cookieRefreshToken !== refreshToken) {
      return setAuthoritativeTokens(cookieAccessToken, cookieRefreshToken)
    }

    const result = await fetchNewAccessToken(cookieRefreshToken ?? refreshToken)

    if (result.status === 'unavailable') {
      throw new SessionUnavailableError(result.retryAfterMs)
    }

    if (result.status === 'rejected') {
      notifySessionExpired()
      throw new Error('Session expired')
    }

    const adopted = setAuthoritativeTokens(result.tokens.accessToken, result.tokens.refreshToken)

    if (persistTokens) {
      try {
        await persistTokens(result.tokens)
      } catch (error) {
        console.error('❌ Failed to persist refreshed session:', error)
      }
    }

    return adopted
  })
}
