import { Client, cacheExchange, fetchExchange } from 'urql'
import { openlaneGQLUrl } from '@repo/dally/auth'
import { Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { fetchNewAccessToken } from './auth/utils/refresh-token'
import { signOut } from 'next-auth/react'
import { JwtPayload } from 'jsonwebtoken'
import { authExchange } from '@urql/exchange-auth'

export const createClient = (session: Session) => {
  return new Client({
    url: openlaneGQLUrl,
    exchanges: [
      cacheExchange,
      authExchange(async (utils) => ({
        addAuthToOperation(operation) {
          const token = session?.user?.accessToken || ''

          if (!token) {
            return operation
          }

          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          })
        },
        didAuthError(error) {
          const token = session?.user?.accessToken
          let isTokenExpired = false

          if (token) {
            try {
              const decodedToken = jwtDecode<JwtPayload>(token)
              if (decodedToken.exp) {
                isTokenExpired = Date.now() >= decodedToken.exp * 1000
              }
            } catch (err) {
              console.error('Error decoding token:', err)
            }
          }

          return isTokenExpired
        },
        async refreshAuth() {
          if (!session?.user?.refreshToken) {
            console.error('No refresh token available, logging out.')
            signOut()
            return
          }

          try {
            const newToken = await fetchNewAccessToken(session.user.refreshToken)

            if (!newToken || !newToken.accessToken) {
              console.error('Failed to refresh token, logging out.')
              signOut()
              return
            }

            session.user.accessToken = newToken.accessToken
            session.user.refreshToken = newToken.refreshToken
          } catch (err) {
            console.error('Error during token refresh:', err)
            signOut()
          }
        },
      })),
      fetchExchange,
    ],
    fetchOptions: {
      credentials: 'include',
    },
  })
}

export const createSubscriberClient = () =>
  new Client({
    url: '/api/graphql',
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
