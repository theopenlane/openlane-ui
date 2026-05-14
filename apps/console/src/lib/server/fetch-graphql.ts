'use server'

import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { sessionCookieName } from '@repo/dally/auth'

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export const fetchGraphqlServer = async <T>(query: string, variables: Record<string, unknown>, accessToken: string, sessionCookie: string): Promise<T | null> => {
  const url = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''
  const queryName = query.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? '<anonymous>'
  const start = Date.now()

  if (!url) {
    console.error('[metadata-gql] NEXT_PUBLIC_API_GQL_URL is not set', { queryName })
    return null
  }

  console.log('[metadata-gql] starting', {
    queryName,
    url,
    hasAccessToken: !!accessToken,
    hasSessionCookie: !!sessionCookie,
    variableKeys: Object.keys(variables),
  })

  try {
    const response = await secureFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Cookie: `${sessionCookieName}=${sessionCookie}`,
      },
      body: JSON.stringify({ query, variables }),
    })

    const elapsedMs = Date.now() - start

    if (!response.ok) {
      const bodyPreview = await response.text().catch(() => '<unreadable>')
      console.error('[metadata-gql] non-2xx response', {
        queryName,
        status: response.status,
        statusText: response.statusText,
        elapsedMs,
        bodyPreview: bodyPreview.slice(0, 300),
      })
      return null
    }

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors?.length) {
      console.error('[metadata-gql] GraphQL errors', {
        queryName,
        elapsedMs,
        errors: result.errors.map((e) => e.message),
      })
      return null
    }

    console.log('[metadata-gql] success', { queryName, elapsedMs, hasData: result.data !== undefined })
    return result.data ?? null
  } catch (error) {
    console.error('[metadata-gql] network error', {
      queryName,
      elapsedMs: Date.now() - start,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    })
    return null
  }
}
