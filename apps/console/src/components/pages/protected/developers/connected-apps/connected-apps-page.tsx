'use client'

import React, { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ApiTokenOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { PageHeading } from '@repo/ui/page-heading'
import { CONNECTED_APPS_PATH } from '@repo/evidence-capture/connect'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useGetApiTokens } from '@/lib/graphql-hooks/tokens'
import { useApiTokenAccessReason, useConnectedAppConnectReason } from '../hooks/use-api-token-access-reason'
import { CONNECTED_APP_TOKEN_NAMES, CONNECTED_APPS } from './connected-apps'
import { ConnectedAppCard } from './connected-app-card'

const API_TOKENS_PATH = '/developers/api-tokens'

const NEWEST_FIRST = [{ field: ApiTokenOrderField.created_at, direction: OrderDirection.DESC }]

const ConnectedAppsPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const manageDisabledReason = useApiTokenAccessReason('Only organization owners and admins can connect or revoke apps.')
  const connectDisabledReason = useConnectedAppConnectReason('Only organization owners and admins can connect or revoke apps.')
  const [activeAfter] = useState(() => new Date().toISOString())
  const where = { nameIn: CONNECTED_APP_TOKEN_NAMES, isActive: true, or: [{ expiresAtGT: activeAfter }, { expiresAtIsNil: true }] }
  const { data, isLoading, isError, error } = useGetApiTokens({ where, orderBy: NEWEST_FIRST })
  const tokens = getNodes(data?.apiTokens)
  const totalCount = data?.apiTokens.totalCount ?? 0
  const authorMaps = useAuthorMaps(tokens.map((token) => token.createdBy))
  useQueryErrorNotification({ error, description: 'Failed to load connected apps' })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Developers', href: CONNECTED_APPS_PATH },
      { label: 'Connected Apps', href: CONNECTED_APPS_PATH },
    ])
  }, [setCrumbs])

  return (
    <div className="space-y-4">
      <PageHeading heading="Connected Apps" subheading="Apps and integrations that act on this organization through a scoped API token." />
      {totalCount > tokens.length && (
        <p className="text-sm text-muted-foreground">
          Showing the {tokens.length} most recent of {totalCount} active connections. Revoke older ones from{' '}
          <Link href={API_TOKENS_PATH} className="text-blue-500 hover:underline">
            API Tokens
          </Link>
          .
        </p>
      )}
      {CONNECTED_APPS.map((app) => (
        <ConnectedAppCard
          key={app.tokenName}
          app={app}
          tokens={tokens.filter((token) => token.name === app.tokenName)}
          authorMaps={authorMaps}
          isLoading={isLoading}
          isError={isError}
          manageDisabledReason={manageDisabledReason}
          connectDisabledReason={connectDisabledReason}
        />
      ))}
    </div>
  )
}

export default ConnectedAppsPage
