'use client'

import { GraphQLClient } from 'graphql-request'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef } from 'react'
import { fetchCSRFToken } from './auth/utils/secure-fetch'
import { probeSession, SessionUnavailableError } from './auth/utils/session-health'
import { recoverTokensAfterUnauthorized, refreshTokens, setTokenPersister } from './auth/utils/session-refresh'
import { getIsSessionInvalid, notifySessionExpired } from './auth/utils/session-status'
import { getUsableTokens, observeSessionTokens, setAuthoritativeTokens, type TokenState } from './auth/utils/session-tokens'

export { getIsSessionInvalid, markSessionExpired } from './auth/utils/session-status'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

let resyncPromise: Promise<Session | null> | null = null

const useSessionUpdateRef = () => {
  const { update } = useSession()
  const updateRef = useRef(update)

  useEffect(() => {
    updateRef.current = update
  }, [update])

  return updateRef
}

export const useSessionTokenSync = () => {
  const { data, update } = useSession()
  const sessionRef = useRef(data)
  const updateRef = useRef(update)
  const accessToken = data?.user?.accessToken
  const refreshToken = data?.user?.refreshToken

  useEffect(() => {
    sessionRef.current = data
    updateRef.current = update
  }, [data, update])

  useEffect(() => {
    setTokenPersister((tokens) => updateRef.current({ ...sessionRef.current, user: tokens }))
    return () => setTokenPersister(null)
  }, [])

  useEffect(() => {
    if (!accessToken) return
    setAuthoritativeTokens(accessToken, refreshToken ?? '')
  }, [accessToken, refreshToken])
}

export const useSessionResync = () => {
  const updateRef = useSessionUpdateRef()

  return useCallback(() => {
    if (!resyncPromise) {
      resyncPromise = updateRef.current().finally(() => {
        resyncPromise = null
      })
    }

    return resyncPromise
  }, [updateRef])
}

export const useFetchWithRetry = () => {
  const { data: session } = useSession()
  const resyncSession = useSessionResync()

  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (getIsSessionInvalid()) {
      throw new Error('Session expired')
    }

    const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input
    const isImpersonation = session?.user?.isImpersonation

    let accessToken = session?.user?.accessToken
    let refreshToken = session?.user?.refreshToken

    if (!accessToken || (!refreshToken && !isImpersonation)) {
      const usable = getUsableTokens()

      if (usable && (usable.refreshToken || isImpersonation)) {
        accessToken = usable.accessToken
        refreshToken = usable.refreshToken
      } else {
        const probe = await probeSession()

        if (probe.status === 'unavailable') {
          throw new SessionUnavailableError(probe.retryAfterMs)
        }

        const probedAccessToken = probe.status === 'available' ? probe.session.user?.accessToken : undefined
        const probedRefreshToken = probe.status === 'available' ? probe.session.user?.refreshToken : undefined
        const probedImpersonation = probe.status === 'available' ? probe.session.user?.isImpersonation : false

        if (!probedAccessToken || (!probedRefreshToken && !probedImpersonation)) {
          notifySessionExpired()
          throw new Error('Session expired')
        }

        accessToken = probedAccessToken
        refreshToken = probedRefreshToken
        void resyncSession()
      }
    }

    let current: TokenState
    try {
      current = observeSessionTokens(accessToken, refreshToken ?? '')
    } catch (e) {
      console.error('❌ Failed to decode access token:', e)
      notifySessionExpired()
      throw new Error('Session expired', { cause: e })
    }

    if (Date.now() >= current.refreshAt && current.refreshToken) {
      current = await refreshTokens(current.refreshToken)
    }

    const headers = new Headers(init?.headers || {})
    headers.set('Authorization', `Bearer ${current.accessToken}`)
    headers.set('Content-Type', 'application/json')

    let csrfCookieValue = getCookie(csrfCookieName)

    if (!csrfCookieValue) {
      try {
        csrfCookieValue = await fetchCSRFToken()
      } catch (error) {
        console.log('❌ CSRF fetch failed:', error)
      }
    }

    if (csrfCookieValue) {
      headers.set(csrfHeader, csrfCookieValue)
      headers.set('cookie', `${csrfCookieName}=${csrfCookieValue}`)
    } else {
      console.warn('⚠️ [CSRF] No CSRF token available — requests may fail')
    }

    const makeRequest = async () =>
      await fetch(requestUrl, {
        ...init,
        headers,
        credentials: 'include',
      })

    let response = await makeRequest()

    // Retry a 401 only when recovery actually produced a different access token.
    // recoverTokensAfterUnauthorized reconciles newer tokens first and refuses to
    // call /v1/refresh before the token is due, so an unrelated 401 no longer
    // escalates into a session-destroying logout.
    if (response.status === 401 && !getIsSessionInvalid()) {
      const recovered = await recoverTokensAfterUnauthorized(current)

      // Re-check the latch: a concurrent expiry may have landed while recovery
      // was in flight, and retrying then would be pointless.
      if (recovered && !getIsSessionInvalid()) {
        headers.set('Authorization', `Bearer ${recovered.accessToken}`)
        response = await makeRequest()
      }
    }

    return response
  }

  return fetchWithRetry
}

export const useGetGraphQLClient = () => {
  const fetchWithRetry = useFetchWithRetry()

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    fetch: fetchWithRetry,
    credentials: 'include',
  })
}
