'use server'

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { fetchGraphqlServer } from './fetch-graphql'

interface BuildDetailMetadataArgs<TVariables extends Record<string, unknown>, TData> {
  query: string
  variables: TVariables
  prefix: string
  selectLabel: (data: TData) => string | null | undefined
}

export const buildDetailMetadata = async <TVariables extends Record<string, unknown>, TData>({
  query,
  variables,
  prefix,
  selectLabel,
}: BuildDetailMetadataArgs<TVariables, TData>): Promise<Metadata> => {
  const fallback: Metadata = { title: prefix }

  if (!sessionCookieName) {
    console.error('[metadata-build] missing SESSION_COOKIE_NAME, returning fallback', { prefix })
    return fallback
  }

  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const cookieSession = cookieStore.get(sessionCookieName)?.value
  const token = session?.user?.accessToken

  if (!token || !cookieSession) {
    console.error('[metadata-build] missing credentials, returning fallback', {
      prefix,
      hasToken: !!token,
      hasCookieSession: !!cookieSession,
      sessionCookieName,
    })
    return fallback
  }

  const data = await fetchGraphqlServer<TData>(query, variables, token, cookieSession)
  if (!data) {
    console.warn('[metadata-build] fetch returned null, returning fallback', { prefix })
    return fallback
  }

  const label = selectLabel(data)
  if (!label) {
    console.warn('[metadata-build] selectLabel returned empty, returning fallback', { prefix })
    return fallback
  }

  console.log('[metadata-build] resolved title', { prefix, label })
  return { title: `${prefix} - ${label}` }
}
