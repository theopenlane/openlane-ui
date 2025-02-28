import { GraphQLClient, RequestMiddleware } from 'graphql-request'
import { fetchNewAccessToken } from './auth/utils/refresh-token'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { sessionCookieName } from '@repo/dally/auth'

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split('; ')
  const found = cookies.find((row) => row.startsWith(`${name}=`))
  return found ? found.split('=')[1] : undefined
}

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL!

export function getGraphQLClient(session: Session) {
  const requestMiddleware: RequestMiddleware = async (request) => {
    let accessToken = session?.user?.accessToken
    const refreshToken = session?.user?.refreshToken
    const sessionCookieValue = getCookie(sessionCookieName!)

    const isTokenExpired = (): boolean => {
      if (!accessToken) return true
      try {
        const decoded = JSON.parse(atob(accessToken.split('.')[1]))
        return decoded.exp ? Date.now() >= decoded.exp * 1000 : true
      } catch (err) {
        console.error('Error decoding token:', err)
        return true
      }
    }

    if (isTokenExpired() && refreshToken) {
      try {
        const newToken = await fetchNewAccessToken(refreshToken)
        if (!newToken || !newToken.accessToken) throw new Error('Token refresh failed')

        session.user.accessToken = newToken.accessToken
        session.user.refreshToken = newToken.refreshToken
        accessToken = newToken.accessToken
      } catch (err) {
        console.error('Token refresh error:', err)
        await signOut()
        return request
      }
    }

    if (!accessToken) {
      await signOut()
      return request
    }

    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.set('Content-Type', 'application/json')

    if (sessionCookieValue) {
      headers.set('Cookie', `${sessionCookieName}=${sessionCookieValue}`)
    }

    console.log('request', request)

    return {
      ...request,
      headers,
    }
  }

  return new GraphQLClient(GRAPHQL_ENDPOINT, {
    requestMiddleware,
    credentials: 'include',
  })
}
