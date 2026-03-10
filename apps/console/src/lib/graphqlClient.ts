'use client'

import { GraphQLClient } from 'graphql-request'
import { csrfCookieName, csrfHeader } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { fetchNewAccessToken, Tokens } from './auth/utils/refresh-token'
import { jwtDecode } from 'jwt-decode'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'
import { fetchCSRFToken } from './auth/utils/secure-fetch'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL!

let isSessionInvalid = false
let sessionExpiredModalOpen = false
let refreshPromise: Promise<Tokens | null> | null = null
let lastAccessToken = ''
let refreshAllowedAfter = Number.POSITIVE_INFINITY
let csrfPromise: Promise<string> | null = null

export function useGetGraphQLClient() {
  const { update, data: session } = useSession()

  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (isSessionInvalid) {
      if (!sessionExpiredModalOpen) {
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
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
      if (!csrfPromise) {
        console.log('⏳ Fetching new CSRF token...')
        csrfPromise = fetchCSRFToken()
      } else {
        console.log('🕓 Waiting for existing CSRF promise...')
        csrfPromise = fetchCSRFToken()
      }

      try {
        csrfCookieValue = await csrfPromise
        console.log('✅ CSRF token fetched successfully.')
      } catch (error) {
        console.log('❌ CSRF fetch failed:', error)
      } finally {
        csrfPromise = null
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
        updateRefreshSchedule(accessToken, refreshToken)
      } catch (e) {
        console.error('❌ Failed to decode refresh token:', e)
        handleSessionExpired()
        throw new Error('Session expired')
      }
    }

    const refreshBeforeExpired = now >= refreshAllowedAfter

    if (refreshBeforeExpired) {
      console.log('⏰ Access token near expiry, refreshing now...')

      try {
        await handleTokenRefresh({
          refreshToken,
          session,
          update,
          headers,
        })
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
        await handleTokenRefresh({
          refreshToken,
          session,
          update,
          headers,
        })
        response = await makeRequest()
      } catch {
        refreshPromise = null
        handleSessionExpired()
        throw new Error('Session expired')
      }
    }

    return response
  }

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

function updateRefreshSchedule(accessToken: string, refreshToken: string) {
  const decoded: { nbf?: number } = jwtDecode(refreshToken)
  const nbf = decoded.nbf ? decoded.nbf * 1000 : 0
  refreshAllowedAfter = nbf
  lastAccessToken = accessToken
}

async function handleTokenRefresh({
  refreshToken,
  session,
  update,
  headers,
}: {
  refreshToken: string
  session: Session | null
  update: ReturnType<typeof useSession>['update']
  headers?: Headers
}): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!refreshPromise) {
    refreshPromise = fetchNewAccessToken(refreshToken)
  }

  try {
    const newTokens = await refreshPromise
    refreshPromise = null

    if (!newTokens?.accessToken) {
      throw new Error('Token refresh failed')
    }

    if (session) {
      session.user.accessToken = newTokens.accessToken
      session.user.refreshToken = newTokens.refreshToken
    }

    if (headers) {
      headers.set('Authorization', `Bearer ${newTokens.accessToken}`)
    }

    await update({
      ...session,
      user: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      },
    })

    updateRefreshSchedule(newTokens.accessToken, newTokens.refreshToken)

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    }
  } catch (error) {
    refreshPromise = null
    throw error
  }
}
