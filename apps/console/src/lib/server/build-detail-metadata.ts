'use server'

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { fetchGraphqlServer } from './fetch-graphql'
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

  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const cookieSession = cookieStore.get(sessionCookieName as string)?.value
  const token = session?.user?.accessToken
  const organizationId = session?.user?.activeOrganizationId

  if (!token || !cookieSession) {
    return fallback
  }

  const [data, orgName] = await Promise.all([fetchGraphqlServer<TData>(query, variables, token, cookieSession), getOrgDisplayNameForRequest(token, cookieSession, organizationId)])

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
