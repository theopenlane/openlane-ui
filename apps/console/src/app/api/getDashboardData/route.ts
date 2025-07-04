'use server'

import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { sessionCookieName } from '@repo/dally/auth'

const GetDashboardDataDocument = `
  query {
    organizations {
      edges {
        node {
          id
          displayName
        }
      }
    }
  }
`

export async function getDashboardData(accessToken: string, session: string) {
  try {
    const response = await secureFetch(process.env.NEXT_PUBLIC_API_GQL_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${session}`,
      },
      body: JSON.stringify({
        query: GetDashboardDataDocument,
        variables: {},
      }),
    })

    const result = await response.json()

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors)
      return null
    }

    return result.data ?? null
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}
