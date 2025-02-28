import { GraphQLClient, RequestMiddleware } from 'graphql-request'
import type { Session } from 'next-auth'
import { sessionCookieName } from '@repo/dally/auth'
import { ensureAuth } from './auth/utils/tokenValidator'
import { getCookie } from './auth/utils/getCookie'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL!

export function getGraphQLClient(session: Session) {
  const requestMiddleware: RequestMiddleware = async (request) => {
    const accessToken = await ensureAuth(session)
    if (!accessToken) {
      return request
    }

    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.set('Content-Type', 'application/json')

    const sessionCookieValue = getCookie(sessionCookieName!)
    if (sessionCookieValue) {
      headers.set('Cookie', `${sessionCookieName}=${sessionCookieValue}`)
    }

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
