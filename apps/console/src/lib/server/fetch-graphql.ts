import 'server-only'
import { sessionCookieName } from '@repo/dally/auth'
import { jsonContentType } from '@/lib/auth/utils/secure-fetch'
import { coreFetch } from '@/lib/server/core-fetch'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

const MUTATION_DOCUMENT = /^\s*mutation\b/i

export const queryGraphqlServer = async <T>(query: string, variables: Record<string, unknown>, accessToken: string, sessionCookie: string): Promise<T | null> => {
  if (MUTATION_DOCUMENT.test(query)) {
    throw new Error('queryGraphqlServer only sends read-only operations; send mutations through serverSecureFetch')
  }

  try {
    const response = await coreFetch(process.env.NEXT_PUBLIC_API_GQL_URL ?? '', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${sessionCookie}`,
        'Content-Type': jsonContentType,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      console.error('[queryGraphqlServer] request failed:', response.status, response.statusText)
      return null
    }

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors?.length) {
      console.warn('[queryGraphqlServer] GraphQL errors:', result.errors)
      return null
    }

    return result.data ?? null
  } catch (error) {
    console.error('[queryGraphqlServer] network error:', error)
    return null
  }
}
