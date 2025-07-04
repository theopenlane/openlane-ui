'use client'

import { GraphQLClient } from 'graphql-request'
import { sessionCookieName } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { fetchNewAccessToken, Tokens } from './auth/utils/refresh-token'
import { jwtDecode } from 'jwt-decode'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL!

let isSessionInvalid = false
let refreshPromise: Promise<Tokens | null> | null = null
let lastAccessToken = ''
let refreshAllowedAfter = Number.POSITIVE_INFINITY

export function useGetGraphQLClient() {
  const { update, data: session } = useSession()

  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (isSessionInvalid) {
      throw new Error('Session invalid')
    }

    const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input
    const accessToken = session?.user?.accessToken
    const refreshToken = session?.user?.refreshToken

    if (!accessToken || !refreshToken) {
      handleSessionExpired()
    }

    const headers = new Headers(init?.headers || {})
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.set('Content-Type', 'application/json')

    const sessionCookieValue = getCookie(sessionCookieName!)
    if (sessionCookieValue) {
      headers.set('Cookie', `${sessionCookieName}=${sessionCookieValue}`)
    }

    const now = Date.now()

    const accessTokenChanged = accessToken !== lastAccessToken
    if (accessTokenChanged) {
      try {
        updateRefreshSchedule(accessToken, refreshToken)
      } catch (e) {
        console.error('❌ Failed to decode refresh token:', e)
        handleSessionExpired()
      }
    }

    const refreshBeforeExpired = now >= refreshAllowedAfter

    if (refreshBeforeExpired) {
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

    const makeRequest = () =>
      fetch(requestUrl, {
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

//helpers:

function handleSessionExpired() {
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
