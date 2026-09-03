'use client'

import type { Session } from 'next-auth'
import { fetchNewAccessToken } from './refresh-token'
import { probeSession, resetSessionProbe, SessionUnavailableError } from './session-health'
import { getIsSessionInvalid, notifySSOReauthRequired, notifySessionExpired } from './session-status'
import { describeToken } from './token-claims'
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

// Bumped whenever the NextAuth session actually takes a new pair. /api routes authenticate
// with the token in that session, not the one on the request, so this is the only signal that
// their credential moved. See recoverUnauthorized.
let sessionSyncGeneration = 0

export const getSessionSyncGeneration = () => sessionSyncGeneration

export const setTokenPersister = (persist: TokenPersister | null) => {
  persistTokens = persist
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
      const persisted = await persist(tokens)
      const stored = persisted?.user?.accessToken === tokens.accessToken && persisted?.user?.refreshToken === tokens.refreshToken

      if (stored) {
        sessionSyncGeneration += 1
        resetSessionProbe()
        console.info('✅ NextAuth session took the refreshed tokens', { at: new Date().toISOString(), attempt, token: describeToken(tokens.accessToken) })

        return true
      }

      const detail = {
        attempt,
        wanted: describeToken(tokens.accessToken),
        stored: describeToken(persisted?.user?.accessToken),
        refreshTokenMatched: persisted?.user?.refreshToken === tokens.refreshToken,
      }

      if (isLastAttempt) {
        console.error('❌ NextAuth session did not take the refreshed tokens after retrying', detail)
      } else {
        console.warn('⚠️ NextAuth session did not take the refreshed tokens, retrying', detail)
      }
    } catch (error) {
      if (isLastAttempt) {
        console.error('❌ Failed to write the refreshed tokens to the NextAuth session after retrying', { attempt, wanted: describeToken(tokens.accessToken), error })
      } else {
        console.warn('⚠️ Failed to write the refreshed tokens to the NextAuth session, retrying', { attempt, error })
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
      console.info('🔄 adopted a newer token from the session', { at: new Date().toISOString(), from: describeToken(known?.accessToken), to: describeToken(adopted.accessToken) })
      await persistToSession(adopted)
      return adopted
    }

    if (cookieDiffers && known?.refreshToken && Date.now() < known.refreshAt) {
      // The session cookie is behind what this tab holds. Push our pair back into it, /api
      // routes read their credential from there, so this is the repair they need.
      console.warn('⚠️ NextAuth session is behind this tab, resyncing', { session: describeToken(cookieAccessToken), tab: describeToken(known.accessToken) })
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

    // Don't commit a refresh that was already in flight when the session ended, or logout
    // hands the browser fresh credentials and a new core session on its way out.
    if (getIsSessionInvalid()) {
      throw new Error('Session expired')
    }

    const adopted = setAuthoritativeTokens(result.tokens.accessToken, result.tokens.refreshToken)
    console.info('🔄 refreshed over the network', { at: new Date().toISOString(), from: describeToken(refreshCandidate?.accessToken), to: describeToken(adopted.accessToken) })

    await persistToSession(adopted)

    return adopted
  })
}

// Cheapest source first: memory, then a refresh, then the NextAuth session. Throws rather than
// handing back something unusable.
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

// Returns the tokens to retry with, or null if nothing changed and the caller should just
// surface the 401. Won't refresh before the token is due by default, core's nbf makes that a
// guaranteed failure. forceRefresh lifts only that gate, for the one case nothing else fixes:
// the session cookie died while the token is still fresh, and only a browser /v1/refresh
// brings it back.
export const recoverTokensAfterUnauthorized = async (failedTokens: TokenState, { forceRefresh = false }: RecoveryOptions = {}): Promise<TokenState | null> => {
  const known = getKnownTokens()

  if (known && known.accessToken !== failedTokens.accessToken && isTokenUsable(known.accessToken)) {
    return known
  }

  const refreshToken = known?.refreshToken || failedTokens.refreshToken

  if (!refreshToken) {
    return null
  }

  // Too early to succeed, and finding that out inside refreshTokens costs a probe under the
  // lock, and a burst of 401s would queue up behind each other.
  if (forceRefresh) {
    const readyAt = getRefreshTokenReadyAt(refreshToken)

    if (readyAt !== null && Date.now() < readyAt) {
      return null
    }
  }

  const recovered = await refreshTokens(refreshToken, { networkOnlyIfDue: !forceRefresh })

  return recovered.accessToken !== failedTokens.accessToken && isTokenUsable(recovered.accessToken) ? recovered : null
}
