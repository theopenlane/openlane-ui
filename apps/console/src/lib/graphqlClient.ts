'use client'

import { GraphQLClient } from 'graphql-request'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { jwtDecode } from 'jwt-decode'
import { getCookie } from './auth/utils/getCookie'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { fetchCSRFToken, invalidateCSRFToken, isCSRFRejection } from './auth/utils/secure-fetch'
import { probeSession, SessionUnavailableError } from './auth/utils/session-health'
import { clearSSOReauthRequired, getIsSessionInvalid, notifySessionExpired, reportSSORequirementFromResponse } from './auth/utils/session-status'

export { getIsSessionInvalid, markSessionExpired } from './auth/utils/session-status'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''
const ACCESS_REFRESH_BUFFER_MS = 60_000

let resyncPromise: Promise<Session | null> | null = null

const accessTokenExpiresAt = (accessToken?: string | null): number => {
  if (!accessToken) {
    return 0
  }

  try {
    const { exp } = jwtDecode<{ exp?: number }>(accessToken)

    return exp ? exp * 1000 : Number.POSITIVE_INFINITY
  } catch {
    return 0
  }
}

// currentAccessToken asks the session route for the token pair, which refreshes it server side when due
export const currentAccessToken = async (maxAgeMs?: number): Promise<string> => {
  const probe = await probeSession({ maxAgeMs })

  if (probe.status === 'unavailable') {
    throw new SessionUnavailableError(probe.retryAfterMs)
  }

  const accessToken = probe.status === 'available' ? probe.session.user?.accessToken : undefined

  if (!accessToken) {
    notifySessionExpired()
    throw new Error('Session expired')
  }

  return accessToken
}

const useSessionUpdateRef = () => {
  const { update } = useSession()
  const updateRef = useRef(update)

  useEffect(() => {
    updateRef.current = update
  }, [update])

  return updateRef
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
  const sessionAccessToken = session?.user?.accessToken
  const accessExpiresAt = useMemo(() => accessTokenExpiresAt(sessionAccessToken), [sessionAccessToken])

  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (getIsSessionInvalid()) {
      throw new Error('Session expired')
    }

    const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input

    let accessToken = sessionAccessToken

    if (!accessToken || Date.now() >= accessExpiresAt - ACCESS_REFRESH_BUFFER_MS) {
      accessToken = await currentAccessToken()
      void resyncSession()
    }

    const headers = new Headers(init?.headers || {})
    headers.set('Authorization', `Bearer ${accessToken}`)
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

    if (response.status === 401 && !getIsSessionInvalid()) {
      headers.set('Authorization', `Bearer ${await currentAccessToken(0)}`)
      void resyncSession()
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
