'use client'

import type { Session } from 'next-auth'
import { fetchNewAccessToken } from './refresh-token'
import { probeSession, resetSessionProbe, SessionUnavailableError } from './session-health'
import { getIsSessionInvalid, notifySSOReauthRequired, notifySessionExpired } from './session-status'
import {
  getKnownTokens,
  getRefreshTokenReadyAt,
  getTokenGeneration,
  getUsableTokens,
  isTokenUsable,
  observeSessionTokens,
  readTokenRefreshAt,
  setAuthoritativeTokens,
  type TokenState,
} from './session-tokens'

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

interface RecoveryOptions {
  forceRefresh?: boolean
}

interface PersistableTokens {
  accessToken: string
  refreshToken: string
}

type TokenPersister = (tokens: PersistableTokens) => Promise<Session | null>

const PERSIST_ATTEMPTS = 2

let persistTokens: TokenPersister | null = null

export const setTokenPersister = (persist: TokenPersister | null) => {
  persistTokens = persist
}

const storesBothTokens = async (persist: TokenPersister, { accessToken, refreshToken }: PersistableTokens): Promise<boolean> => {
  const persisted = await persist({ accessToken, refreshToken })

  return persisted?.user?.accessToken === accessToken && persisted?.user?.refreshToken === refreshToken
}

const persistToSession = async (tokens: PersistableTokens): Promise<boolean> => {
  const persist = persistTokens

  if (!persist) {
    if (typeof window !== 'undefined') {
      console.error('❌ No session persister registered — the refreshed token cannot reach the server session')
    }

    return false
  }

  for (let attempt = 1; attempt <= PERSIST_ATTEMPTS; attempt += 1) {
    const isLastAttempt = attempt === PERSIST_ATTEMPTS

    try {
      if (await storesBothTokens(persist, tokens)) {
        resetSessionProbe()
        return true
      }

      if (isLastAttempt) {
        console.error('❌ Session update did not store the refreshed tokens after retrying')
      } else {
        console.warn('⚠️ Session update did not store the refreshed tokens, retrying')
      }
    } catch (error) {
      if (isLastAttempt) {
        console.error('❌ Failed to persist refreshed session after retrying:', error)
      } else {
        console.warn('⚠️ Failed to persist refreshed session, retrying:', error)
      }
    }
  }

  return false
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

    // A refresh already in flight when the session ended must not commit, or logout hands
    // the browser live credentials and a brand new core session on its way out.
    if (getIsSessionInvalid()) {
      throw new Error('Session expired')
    }

    const adopted = setAuthoritativeTokens(result.tokens.accessToken, result.tokens.refreshToken)

    await persistToSession(adopted)

    return adopted
  })
}

/**
 * The token a request starts from, cheapest source first: memory, then a refresh, then the
 * NextAuth session. Throws rather than handing back something unusable.
 */
export const resolveCurrentTokens = async (): Promise<TokenState> => {
  if (getIsSessionInvalid()) {
    throw new Error('Session expired')
  }

  const usable = getUsableTokens()

  if (usable) {
    return usable
  }

  const known = getKnownTokens()

  if (known?.refreshToken) {
    return await refreshTokens(known.refreshToken)
  }

  const probe = await probeSession()

  if (probe.status === 'unavailable') {
    throw new SessionUnavailableError(probe.retryAfterMs)
  }

  if (probe.status === 'signed-out' || !probe.session.user?.accessToken) {
    notifySessionExpired()
    throw new Error('Session expired')
  }

  const observed = observeSessionTokens(probe.session.user.accessToken, probe.session.user.refreshToken ?? '')
  const usableAfterProbe = getUsableTokens()

  if (usableAfterProbe) {
    return usableAfterProbe
  }

  if (observed.refreshToken) {
    return await refreshTokens(observed.refreshToken)
  }

  return observed
}

/**
 * Recover from a 401, or return null when nothing changed and the caller should surface it.
 *
 * Refuses to refresh before the token is due by default, since core's `nbf` makes an early
 * refresh a guaranteed failure. `forceRefresh` lifts only that gate: the Openlane session
 * cookie expires on its own schedule and a browser /v1/refresh is the only thing that
 * reinstalls it, so a 401 on a still-fresh token is the evidence that promotes it to due.
 */
export const recoverTokensAfterUnauthorized = async (failedTokens: TokenState, { forceRefresh = false }: RecoveryOptions = {}): Promise<TokenState | null> => {
  const known = getKnownTokens()

  if (known && known.accessToken !== failedTokens.accessToken && isTokenUsable(known.accessToken)) {
    return known
  }

  const refreshToken = known?.refreshToken || failedTokens.refreshToken

  if (!refreshToken) {
    return null
  }

  // Before `nbf` this cannot succeed, and finding that out costs a probe under the refresh
  // lock — a burst of 401s would serialize into a convoy. Decline here instead.
  if (forceRefresh) {
    const readyAt = getRefreshTokenReadyAt(refreshToken)

    if (readyAt !== null && Date.now() < readyAt) {
      return null
    }
  }

  const recovered = await refreshTokens(refreshToken, { networkOnlyIfDue: !forceRefresh })

  return recovered.accessToken !== failedTokens.accessToken && isTokenUsable(recovered.accessToken) ? recovered : null
}
