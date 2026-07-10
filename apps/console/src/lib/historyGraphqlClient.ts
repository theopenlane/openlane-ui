'use client'

import { GraphQLClient } from 'graphql-request'
import { useFetchWithRetry } from '@/lib/graphqlClient'

const HISTORY_ENDPOINT = process.env.NEXT_PUBLIC_API_HISTORY_GQL_URL ?? process.env.NEXT_PUBLIC_API_GQL_URL?.replace(/\/query(\/?)$/, '/history/query$1') ?? ''

if (!HISTORY_ENDPOINT && process.env.NODE_ENV !== 'production') {
  console.warn('[historyGraphqlClient] HISTORY_ENDPOINT is empty — set NEXT_PUBLIC_API_HISTORY_GQL_URL or NEXT_PUBLIC_API_GQL_URL')
}

export function useGetHistoryGraphQLClient() {
  const fetchWithRetry = useFetchWithRetry()

  return new GraphQLClient(HISTORY_ENDPOINT, {
    fetch: fetchWithRetry,
    credentials: 'include',
  })
}
