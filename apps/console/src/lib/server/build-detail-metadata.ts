'use server'

import type { Metadata } from 'next'
import { auth } from '@/lib/auth/auth'
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

  const session = await auth()
  const token = session?.user?.accessToken

  if (!token) {
    console.error('[metadata-build] missing access token, returning fallback', { prefix })
    return fallback
  }

  const data = await fetchGraphqlServer<TData>(query, variables, token)
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
