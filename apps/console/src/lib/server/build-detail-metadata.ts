'use server'

import type { Metadata } from 'next'
import { fetchGraphqlServer } from './fetch-graphql'
import { getServerCredentials } from './server-credentials'
import { getOrgDisplayNameForRequest } from './dashboard-data-cache'

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

  const credentials = await getServerCredentials()

  if (!credentials) {
    return fallback
  }

  const { session, accessToken, sessionCookie } = credentials
  const [data, orgName] = await Promise.all([
    fetchGraphqlServer<TData>(query, variables, accessToken, sessionCookie),
    getOrgDisplayNameForRequest(accessToken, sessionCookie, session.user?.activeOrganizationId),
  ])

  if (!data) {
    return fallback
  }

  const label = selectLabel(data)
  if (!label) {
    return fallback
  }

  return {
    title: {
      default: `${prefix} - ${label}`,
      template: `${orgName ?? 'Openlane'} | %s`,
    },
  }
}
