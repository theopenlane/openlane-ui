'use server'

import { cache } from 'react'
import { getDashboardData } from '@/app/api/getDashboardData/route'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'

export const getDashboardDataForRequest = cache(getDashboardData)

export const getOrgDisplayNameForRequest = async (token: string, sessionCookie: string, organizationId: string | undefined): Promise<string | null> => {
  if (!organizationId) return null
  const data = await getDashboardDataForRequest(token, sessionCookie)
  if (!data) return null
  const org = data.organizations.edges.find(({ node }) => node.id === organizationId)
  if (!org?.node.displayName) return null
  return capitalizeFirstLetter(org.node.displayName)
}
