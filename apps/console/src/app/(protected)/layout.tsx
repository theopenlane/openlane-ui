import type { Metadata } from 'next'
import { cache } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { getDashboardData } from '../api/getDashboardData/route'
import { cookies } from 'next/headers'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'

interface OrganizationNode {
  id: string
  displayName: string
}

interface OrganizationEdge {
  node: OrganizationNode
}

const getDashboardDataForRequest = cache(getDashboardData)

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: {
      template: 'Openlane | %s',
      default: 'Openlane',
    },
  }

  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const cookieSession = cookieStore.get(sessionCookieName as string)?.value
  const token = session?.user?.accessToken
  const organizationId = session?.user?.activeOrganizationId

  if (!token || !cookieSession || !organizationId) {
    return fallback
  }

  const dashboardData = await getDashboardDataForRequest(token, cookieSession)
  if (!dashboardData) {
    return fallback
  }

  const organizations: OrganizationEdge[] = dashboardData.organizations.edges
  const org = organizations.find(({ node }) => node.id === organizationId)
  if (!org?.node.displayName) {
    return fallback
  }

  return {
    title: {
      template: `${capitalizeFirstLetter(org.node.displayName)} | %s`,
      default: '',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <DashboardLayout>{children}</DashboardLayout>
}
