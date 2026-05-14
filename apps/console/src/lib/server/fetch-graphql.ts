'use server'

import { cache } from 'react'
import { csrfHeader, sessionCookieName } from '@repo/dally/auth'
import { fetchCSRFToken } from '@/lib/auth/utils/secure-fetch'

const getRequestCSRFToken = cache(fetchCSRFToken)

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export const fetchGraphqlServer = async <T>(query: string, variables: Record<string, unknown>, accessToken: string, sessionCookie: string): Promise<T | null> => {
  try {
    const csrfToken = await getRequestCSRFToken()

    const response = await fetch(process.env.NEXT_PUBLIC_API_GQL_URL ?? '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${sessionCookie}`,
        [csrfHeader]: csrfToken,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      console.error('[fetchGraphqlServer] non-2xx response:', response.status)
      return null
    }

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors?.length) {
      console.error('[fetchGraphqlServer] GraphQL errors:', result.errors)
      return null
    }

    return result.data ?? null
  } catch (error) {
    console.error('[fetchGraphqlServer] network error:', error)
    return null
  }
}
