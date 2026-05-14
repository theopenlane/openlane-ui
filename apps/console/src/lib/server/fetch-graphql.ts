'use server'

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { csrfCookieName, csrfHeader, openlaneAPIUrl } from '@repo/dally/auth'

interface CSRFResponse {
  csrf: string
}

const fetchCSRFForCookies = cache(async (cookieHeader: string): Promise<string | null> => {
  const url = `${openlaneAPIUrl}/csrf`
  const start = Date.now()
  console.log('[metadata-csrf] fetching', { url, hasIncomingCookies: !!cookieHeader })

  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    })

    const elapsedMs = Date.now() - start

    if (!res.ok) {
      const bodyPreview = await res.text().catch(() => '<unreadable>')
      console.error('[metadata-csrf] non-2xx response', {
        url,
        status: res.status,
        statusText: res.statusText,
        elapsedMs,
        bodyPreview: bodyPreview.slice(0, 300),
      })
      return null
    }

    const data: CSRFResponse = await res.json()
    console.log('[metadata-csrf] success', { url, elapsedMs, tokenLength: data.csrf?.length ?? 0 })
    return data.csrf
  } catch (error) {
    console.error('[metadata-csrf] network error', {
      url,
      elapsedMs: Date.now() - start,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    })
    return null
  }
})

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export const fetchGraphqlServer = async <T>(query: string, variables: Record<string, unknown>, accessToken: string): Promise<T | null> => {
  const url = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''
  const queryName = query.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? '<anonymous>'
  const start = Date.now()

  if (!url) {
    console.error('[metadata-gql] NEXT_PUBLIC_API_GQL_URL is not set', { queryName })
    return null
  }

  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()])
  const incomingCookieHeader = requestHeaders.get('cookie') ?? ''
  const incomingCookieNames = cookieStore.getAll().map((c) => c.name)
  const existingCsrf = cookieStore.get(csrfCookieName)?.value

  console.log('[metadata-gql] starting', {
    queryName,
    url,
    hasAccessToken: !!accessToken,
    hasIncomingCookies: !!incomingCookieHeader,
    incomingCookieNames,
    hasExistingCsrf: !!existingCsrf,
    variableKeys: Object.keys(variables),
  })

  let csrfToken: string | null | undefined = existingCsrf
  let outgoingCookieHeader = incomingCookieHeader

  if (!csrfToken) {
    csrfToken = await fetchCSRFForCookies(incomingCookieHeader)
    if (!csrfToken) {
      console.error('[metadata-gql] aborting: no CSRF token available', { queryName })
      return null
    }
    outgoingCookieHeader = incomingCookieHeader ? `${incomingCookieHeader}; ${csrfCookieName}=${csrfToken}` : `${csrfCookieName}=${csrfToken}`
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Cookie: outgoingCookieHeader,
        [csrfHeader]: csrfToken,
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
