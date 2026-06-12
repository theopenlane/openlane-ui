'use client'

import { GraphQLClient } from 'graphql-request'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { fetchNewAccessToken, type Tokens } from './auth/utils/refresh-token'
import { jwtDecode } from 'jwt-decode'
import { getSession, useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef } from 'react'
import { fetchCSRFToken } from './auth/utils/secure-fetch'
import { buildLoginRedirect } from './auth/utils/redirect'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

const SESSION_REFRESH_LOCK = 'openlane-session-refresh'

let isSessionInvalid = false
let sessionExpiredModalOpen = false
let refreshPromise: Promise<Tokens | null> | null = null
let lastAccessToken = ''
let refreshAllowedAfter = Number.POSITIVE_INFINITY

export function useFetchWithRetry() {
  const { data: session } = useSession()
  const refreshSession = useSessionRefresh()

  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (isSessionInvalid) {
      if (!sessionExpiredModalOpen) {
        const currentPath = window.location.pathname + window.location.search
        if (window.location.pathname !== '/login') {
          window.location.href = buildLoginRedirect(currentPath)
        }
        resetSessionState()
      }
      throw new Error('Session invalid')
    }

    const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input
    const accessToken = session?.user?.accessToken
    const refreshToken = session?.user?.refreshToken

    if (!accessToken || !refreshToken) {
      handleSessionExpired()
      throw new Error('Session expired')
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

    const now = Date.now()

    const accessTokenChanged = accessToken !== lastAccessToken
    if (accessTokenChanged) {
      try {
        updateRefreshSchedule(accessToken)
      } catch (e) {
        console.error('❌ Failed to decode access token:', e)
        handleSessionExpired()
        throw new Error('Session expired', { cause: e })
      }
    }

    const refreshBeforeExpired = now >= refreshAllowedAfter

    if (refreshBeforeExpired) {
      console.log('⏰ Access token near expiry, refreshing now...')

      try {
        await refreshSession(refreshToken, headers)
      } catch (e) {
        console.error('❌ Token refresh failed:', e)
        handleSessionExpired()
        throw e
      }
    }

    const makeRequest = async () =>
      await fetch(requestUrl, {
        ...init,
        headers,
        credentials: 'include',
      })

    let response = await makeRequest()

    if (response.status === 401 && refreshToken && !isSessionInvalid) {
      try {
        await refreshSession(refreshToken, headers)
        response = await makeRequest()
      } catch (e) {
        refreshPromise = null
        handleSessionExpired()
        throw new Error('Session expired', { cause: e })
      }
    }

    return response
  }

  return fetchWithRetry
}

export function useGetGraphQLClient() {
  const fetchWithRetry = useFetchWithRetry()

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    fetch: fetchWithRetry,
    credentials: 'include',
  })
}

export function resetSessionState() {
  isSessionInvalid = false
  sessionExpiredModalOpen = false
  refreshPromise = null
  lastAccessToken = ''
  refreshAllowedAfter = Number.POSITIVE_INFINITY
}

export function markSessionExpired() {
  isSessionInvalid = true
  sessionExpiredModalOpen = true
}

function handleSessionExpired() {
  if (isSessionInvalid) return
  isSessionInvalid = true
  window.dispatchEvent(new Event('session-expired'))
}

function updateRefreshSchedule(accessToken: string) {
  const decoded: { iat?: number; exp?: number } = jwtDecode(accessToken)
  if (!decoded.exp) {
    refreshAllowedAfter = Number.POSITIVE_INFINITY
    return
  }
  const expMs = decoded.exp * 1000
  const ttlMs = decoded.iat ? (decoded.exp - decoded.iat) * 1000 : 60_000
  const bufferMs = Math.min(60_000, ttlMs * 0.05)
  refreshAllowedAfter = expMs - bufferMs
  lastAccessToken = accessToken
}

export function useSessionRefresh() {
  const { update } = useSession()
  const updateRef = useRef(update)
  useEffect(() => {
    updateRef.current = update
  }, [update])

  return useCallback(async (refreshToken: string, headers?: Headers): Promise<{ accessToken: string; refreshToken: string } | null> => {
    const doRefresh = async () => {
      const latest = await getSession()
      const cookieRefreshToken = latest?.user?.refreshToken
      const cookieAccessToken = latest?.user?.accessToken

      if (cookieRefreshToken && cookieAccessToken && cookieRefreshToken !== refreshToken) {
        await updateRef.current(latest)
        if (headers) headers.set('Authorization', `Bearer ${cookieAccessToken}`)
        updateRefreshSchedule(cookieAccessToken)
        return { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken }
      }

      if (!refreshPromise) {
        refreshPromise = fetchNewAccessToken(cookieRefreshToken ?? refreshToken)
      }

      try {
        const newTokens = await refreshPromise
        refreshPromise = null

        if (!newTokens?.accessToken) {
          throw new Error('Token refresh failed')
        }

        if (headers) headers.set('Authorization', `Bearer ${newTokens.accessToken}`)

        await updateRef.current({
          ...latest,
          user: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          },
        })

        updateRefreshSchedule(newTokens.accessToken)

        return {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        }
      } catch (error) {
        refreshPromise = null
        throw error
      }
    }

    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      return navigator.locks.request(SESSION_REFRESH_LOCK, { mode: 'exclusive' }, doRefresh)
    }
    return doRefresh()
  }, [])
}
