import { GraphQLClient } from 'graphql-request'
import type { Session } from 'next-auth'
import { sessionCookieName } from '@repo/dally/auth'
import { getCookie } from './auth/utils/getCookie'
import { signOut } from 'next-auth/react'
import { fetchNewAccessToken, Tokens } from './auth/utils/refresh-token'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL!

// Shared refresh promise to prevent duplicate refresh calls
let refreshPromise: Promise<Tokens | null> | null = null

export function getGraphQLClient(session: Session) {
  const fetchWithRetry = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requestUrl = typeof input === 'string' || input instanceof URL ? input.toString() : input

    let accessToken = session.user?.accessToken
    const refreshToken = session.user?.refreshToken

    const headers = new Headers(init?.headers || {})
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.set('Content-Type', 'application/json')

    const sessionCookieValue = getCookie(sessionCookieName!)
    if (sessionCookieValue) {
      headers.set('Cookie', `${sessionCookieName}=${sessionCookieValue}`)
    }

    const makeRequest = () =>
      fetch(requestUrl, {
        ...init,
        headers,
        credentials: 'include',
      })

    let response = await makeRequest()

    if (response.status === 401 && refreshToken) {
      try {
        if (!refreshPromise) {
          refreshPromise = fetchNewAccessToken(refreshToken)
        }

        const newTokens = await refreshPromise
        refreshPromise = null

        if (!newTokens?.accessToken) throw new Error('Token refresh failed')

        session.user.accessToken = newTokens.accessToken
        session.user.refreshToken = newTokens.refreshToken

        headers.set('Authorization', `Bearer ${newTokens.accessToken}`)

        response = await makeRequest()
      } catch (e) {
        refreshPromise = null
        console.error('Token refresh failed:', e)
        await signOut()
      }
    }

    return response
  }

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    fetch: fetchWithRetry,
    credentials: 'include',
  })
}
