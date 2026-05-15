'use server'

import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { sessionCookieName } from '@repo/dally/auth'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export const fetchGraphqlServer = async <T>(query: string, variables: Record<string, unknown>, accessToken: string, sessionCookie: string): Promise<T | null> => {
  const url = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

  try {
    const response = await secureFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${sessionCookie}`,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      return null
    }

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors?.length) {
      return null
    }

    return result.data ?? null
  } catch {
    return null
  }
}
