'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { GraphiQL } from 'graphiql'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { explorerPlugin } from '@graphiql/plugin-explorer'
import { useTheme } from 'next-themes'
import { useFetchWithRetry } from '@/lib/graphqlClient'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import 'graphiql/graphiql.css'
import '@graphiql/plugin-explorer/dist/style.css'
import './graphql-explorer.css'

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

const explorer = explorerPlugin({ showAttribution: false })

export function GraphQLExplorerPage() {
  const { resolvedTheme } = useTheme()
  const fetchWithRetry = useFetchWithRetry()
  const { setCrumbs } = React.use(BreadcrumbContext)

  // keep a stable ref so the fetcher isn't recreated on every session update
  const fetchRef = useRef(fetchWithRetry)
  fetchRef.current = fetchWithRetry

  const fetcher = useMemo(
    () =>
      createGraphiQLFetcher({
        url: GRAPHQL_ENDPOINT,
        fetch: (...args: Parameters<typeof fetch>) => fetchRef.current(...args),
      }),
    [],
  )

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Developers', href: '/developers/api-tokens' },
      { label: 'GraphQL Explorer', href: '/developers/graphql-explorer' },
    ])
  }, [setCrumbs])

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-border">
      <GraphiQL fetcher={fetcher} plugins={[explorer]} forcedTheme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
    </div>
  )
}
