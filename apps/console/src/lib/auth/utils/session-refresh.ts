'use client'

import type { Session } from 'next-auth'
import { fetchNewAccessToken } from './refresh-token'
import { probeSession, resetSessionProbe, SessionUnavailableError } from './session-health'
import { notifySSOReauthRequired, notifySessionExpired } from './session-status'
import { getKnownTokens, getTokenGeneration, getUsableTokens, isTokenUsable, readTokenRefreshAt, setAuthoritativeTokens, type TokenState } from './session-tokens'

// Web Locks key, not a duration: the namespace is browser-global (hence the prefix) and shared
// across tabs, so an exclusive hold means five open tabs produce one /v1/refresh. The generation
// check inside the lock makes queued waiters adopt the winner's tokens instead of minting their
// own; it degrades to an unsynchronized run() where locks are unavailable.
const SESSION_REFRESH_LOCK = 'openlane-session-refresh'

const MAX_CONSECUTIVE_REFRESH_FAILURES = 5

let consecutiveRefreshFailures = 0
let refreshCooldownUntil = 0
let lastRefreshFailure: Error | null = null

const recordRefreshSuccess = () => {
  consecutiveRefreshFailures = 0
  refreshCooldownUntil = 0
  lastRefreshFailure = null
}

const recordRefreshFailure = (error: Error, retryAfterMs: number): Error => {
  consecutiveRefreshFailures += 1
  refreshCooldownUntil = Date.now() + retryAfterMs
  lastRefreshFailure = error

  if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_REFRESH_FAILURES) {
    console.error(`Giving up on session refresh after ${consecutiveRefreshFailures} consecutive failures`)
    notifySessionExpired()
    lastRefreshFailure = new Error('Session expired')
  }

  return lastRefreshFailure
}

interface RefreshOptions {
  /**
   * Core issues refresh tokens with `nbf = accessTokenExp - 15m`, so a refresh
   * attempted earlier is rejected by design. The proactive path only fires at
   * refreshAt; the reactive 401 path needs this gate, or an unrelated 401
   * escalates into a logout that revokes the session server-side.
   */
  networkOnlyIfDue?: boolean
}

interface PersistableTokens {
  accessToken: string
  refreshToken: string
}

type TokenPersister = (tokens: PersistableTokens) => Promise<Session | null>

let persistTokens: TokenPersister | null = null

export const setTokenPersister = (persist: TokenPersister | null) => {
  persistTokens = persist
}

const persistToSession = async ({ accessToken, refreshToken }: PersistableTokens): Promise<boolean> => {
  if (!persistTokens) {
    if (typeof window !== 'undefined') {
      console.error('❌ No session persister registered — the refreshed token cannot reach the server session')
    }

    return false
  }

  try {
    const persisted = await persistTokens({ accessToken, refreshToken })

    if (persisted?.user?.accessToken !== accessToken) {
      console.error('❌ Session update did not store the refreshed access token')
      return false
    }

    resetSessionProbe()

    return true
  } catch (error) {
    console.error('❌ Failed to persist refreshed session:', error)
    return false
  }
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

    if (lastRefreshFailure && Date.now() < refreshCooldownUntil) {
      const stillUsable = getUsableTokens()

      if (stillUsable) {
        return stillUsable
      }

      throw lastRefreshFailure
    }

    const probe = await probeSession({ maxAgeMs: 0 })

    if (probe.status === 'unavailable') {
      throw recordRefreshFailure(new SessionUnavailableError(probe.retryAfterMs), probe.retryAfterMs)
    }

    if (probe.status === 'signed-out') {
      notifySessionExpired()
      throw new Error('Session expired')
    }

    const cookieAccessToken = probe.session.user?.accessToken
    const cookieRefreshToken = probe.session.user?.refreshToken
    const known = getKnownTokens()

    const cookieDiffers = !!cookieAccessToken && !!cookieRefreshToken && (cookieAccessToken !== known?.accessToken || cookieRefreshToken !== known?.refreshToken)
    const cookieRefreshAt = cookieDiffers ? readTokenRefreshAt(cookieAccessToken) : null
    const cookieOutlivesKnown = cookieRefreshAt !== null && Date.now() < cookieRefreshAt && (!known || cookieRefreshAt >= known.refreshAt)

    if (cookieOutlivesKnown) {
      recordRefreshSuccess()
      const adopted = setAuthoritativeTokens(cookieAccessToken, cookieRefreshToken)
      await persistToSession(adopted)
      return adopted
    }

    if (cookieDiffers && known?.refreshToken && Date.now() < known.refreshAt) {
      await persistToSession(known)
    }

    // Re-read after reconciliation: a concurrent request may have installed a
    // newer token while this one was in flight, and it is THAT token's timing
    // that decides whether a refresh is legal.
    const refreshCandidate = getKnownTokens()

    if (networkOnlyIfDue && refreshCandidate && Date.now() < refreshCandidate.refreshAt) {
      return refreshCandidate
    }

    const result = await fetchNewAccessToken(refreshCandidate?.refreshToken || cookieRefreshToken || refreshToken)

    if (result.status === 'not-ready') {
      if (refreshCandidate) {
        return refreshCandidate
      }

      throw new SessionUnavailableError(Math.max(result.readyAt - Date.now(), 0))
    }

    if (result.status === 'unavailable') {
      throw recordRefreshFailure(new SessionUnavailableError(result.retryAfterMs), result.retryAfterMs)
    }

    if (result.status === 'sso-required') {
      notifySSOReauthRequired(result.requirement)
      throw new Error('SSO re-authentication required')
    }

    if (result.status === 'rejected') {
      notifySessionExpired()
      throw new Error('Session expired')
    }

    recordRefreshSuccess()

    const adopted = setAuthoritativeTokens(result.tokens.accessToken, result.tokens.refreshToken)

    await persistToSession(result.tokens)

    return adopted
  })
}

/**
 * Recover from a 401 without ever refreshing before the token is due.
 *
 * Returns the token state to retry with, or null when nothing changed and the
 * caller should surface the 401 as-is.
 */
export const recoverTokensAfterUnauthorized = async (failedTokens: TokenState): Promise<TokenState | null> => {
  const known = getKnownTokens()

  if (known && known.accessToken !== failedTokens.accessToken && isTokenUsable(known.accessToken)) {
    return known
  }

  const refreshToken = known?.refreshToken || failedTokens.refreshToken

  if (!refreshToken) {
    return null
  }

  const recovered = await refreshTokens(refreshToken, { networkOnlyIfDue: true })

  return recovered.accessToken !== failedTokens.accessToken && isTokenUsable(recovered.accessToken) ? recovered : null
}
