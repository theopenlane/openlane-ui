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

interface RefreshOptions {
  /**
   * Only hit /v1/refresh when the current token has actually reached refreshAt.
   *
   * Core issues refresh tokens with `nbf = accessTokenExp + refreshoverlap`
   * (-15m), so a refresh attempted earlier is rejected BY DESIGN. That is fine
   * for the proactive path, which only fires at refreshAt. The reactive 401
   * path has no such guarantee: a 401 raised for any non-token reason would
   * trigger a doomed refresh, and refresh-token.ts classifies that rejection as
   * `rejected` -> notifySessionExpired() -> the modal's signOut() -> POST
   * /v1/logout, which revokes the tokens and deletes the session server-side.
   * A single unrelated 401 could therefore destroy a perfectly good session.
   */
  networkOnlyIfDue?: boolean
}

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

export const refreshTokens = async (refreshToken: string, { networkOnlyIfDue = false }: RefreshOptions = {}): Promise<TokenState> => {
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
    const known = getKnownTokens()

    // Compare BOTH tokens: keying off the refresh token alone assumes every
    // rotation replaces it, which is not guaranteed.
    if (cookieAccessToken && cookieRefreshToken && (cookieAccessToken !== known?.accessToken || cookieRefreshToken !== known?.refreshToken)) {
      return setAuthoritativeTokens(cookieAccessToken, cookieRefreshToken)
    }

    // Re-read after reconciliation: a concurrent request may have installed a
    // newer token while this one was in flight, and it is THAT token's timing
    // that decides whether a refresh is legal.
    const refreshCandidate = getKnownTokens()

    if (networkOnlyIfDue && refreshCandidate && Date.now() < refreshCandidate.refreshAt) {
      return refreshCandidate
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

/**
 * Recover from a 401 without ever refreshing before the token is due.
 *
 * Returns the token state to retry with, or null when nothing changed and the
 * caller should surface the 401 as-is. Reconciliation (adopting a newer token
 * another tab or request already obtained) always runs; only the network
 * refresh is gated.
 */
export const recoverTokensAfterUnauthorized = async (failedTokens: TokenState): Promise<TokenState | null> => {
  const known = getKnownTokens()

  if (known && known.accessToken !== failedTokens.accessToken) {
    return known
  }

  const refreshToken = known?.refreshToken || failedTokens.refreshToken

  if (!refreshToken) {
    return null
  }

  const recovered = await refreshTokens(refreshToken, { networkOnlyIfDue: true })

  return recovered.accessToken === failedTokens.accessToken ? null : recovered
}
