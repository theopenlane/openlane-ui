import { Client, cacheExchange, fetchExchange } from 'urql'
import { openlaneGQLUrl } from '@repo/dally/auth'
import { Session } from 'next-auth'

export const createClient = (session: Session | null) =>
  new Client({
    url: openlaneGQLUrl,
    // - cacheExchange: implements the default "document caching" behavior
    // - fetchExchange: send our requests to the GraphQL API
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      const token = session?.user?.accessToken
      return {
        headers: { authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      }
    },
  })

export const createSubscriberClient = () =>
  new Client({
    url: '/api/graphql',
    // - cacheExchange: implements the default "document caching" behavior
    // - fetchExchange: send our requests to the GraphQL API
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })
