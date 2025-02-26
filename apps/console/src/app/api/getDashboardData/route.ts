'use server'

import { sessionCookieName } from '@repo/dally/auth'
import { cacheExchange, ssrExchange, fetchExchange, Client } from '@urql/core'

const GetDashboardDataDocument = `
  query {
    organizations {
      edges {
        node {
          id
        }
      }
    }
  }
`

export async function getDashboardData(accessToken: string, session: string) {
  console.log('getDashboardDatagetDashboardDatagetDashboardDatagetDashboardData', getDashboardData)
  try {
    const ssrCache = ssrExchange({ isClient: false })

    const client = new Client({
      url: process.env.NEXT_PUBLIC_API_GQL_URL!,
      suspense: true,
      exchanges: [cacheExchange, ssrCache, fetchExchange],
      fetchOptions: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Cookie: `${sessionCookieName}=${session}`,
        },
      },
    })

    // Corrected query call
    const result = await client.query(GetDashboardDataDocument, {}).toPromise()
    if (result.error) {
      console.error('GraphQL Error:', result.error)
    }

    return result.data ?? null
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}
