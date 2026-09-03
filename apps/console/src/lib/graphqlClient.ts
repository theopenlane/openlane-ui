'use client'

import { GraphQLClient } from 'graphql-request'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef } from 'react'
import { fetchCSRFToken, invalidateCSRFToken, isCSRFRejection } from './auth/utils/secure-fetch'
import { probeSession, SessionUnavailableError } from './auth/utils/session-health'
import { refreshTokens, setTokenPersister } from './auth/utils/session-refresh'
import { clearSSOReauthRequired, getIsSessionInvalid, notifySessionExpired, reportSSORequirementFromResponse } from './auth/utils/session-status'
import { getKnownTokens, getUsableTokens, observeSessionTokens, setAuthoritativeTokens, type TokenState } from './auth/utils/session-tokens'

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

    const post = async () =>
      await fetch(requestUrl, {
        ...init,
        headers,
        credentials: 'include',
      })

    let csrfReplayed = false

    const makeRequest = async () => {
      const attempt = await post()

      if (csrfReplayed || !(await isCSRFRejection(attempt))) {
        return attempt
      }

      csrfReplayed = true
      invalidateCSRFToken()

      try {
        const freshCSRFToken = await fetchCSRFToken()
        headers.set(csrfHeader, freshCSRFToken)
        headers.set('cookie', `${csrfCookieName}=${freshCSRFToken}`)
        return await post()
      } catch (error) {
        console.error('❌ CSRF refetch after a rejected token failed:', error)
        return attempt
      }
    }

    let response = await makeRequest()

    if (await reportSSORequirementFromResponse(response)) {
      return response
    }

    const retryRefreshToken = getKnownTokens()?.refreshToken || refreshToken

    if (response.status === 401 && retryRefreshToken && !getIsSessionInvalid()) {
      const refreshed = await refreshTokens(retryRefreshToken)
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
      response = await makeRequest()
    }

    if (response.ok) {
      clearSSOReauthRequired()
    } else {
      await reportSSORequirementFromResponse(response)
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
