'use client'

import { useGetGraphQLClient } from '@/lib/graphqlClient'

const HISTORY_ENDPOINT = process.env.NEXT_PUBLIC_API_HISTORY_GQL_URL ?? process.env.NEXT_PUBLIC_API_GQL_URL?.replace(/\/query(\/?)$/, '/history/query$1') ?? ''

if (!HISTORY_ENDPOINT && process.env.NODE_ENV !== 'production') {
  console.warn('[historyGraphqlClient] HISTORY_ENDPOINT is empty — set NEXT_PUBLIC_API_HISTORY_GQL_URL or NEXT_PUBLIC_API_GQL_URL')
}

export const useGetHistoryGraphQLClient = () => useGetGraphQLClient({ endpoint: HISTORY_ENDPOINT })
