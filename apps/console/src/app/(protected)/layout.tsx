import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { getDashboardData, OrganizationsData } from '../api/getDashboardData/route'
import { cookies } from 'next/headers'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'

interface OrganizationNode {
  id: string
  displayName: string
}

interface OrganizationEdge {
  node: OrganizationNode
}

let currentOrganizationId: string
let dashboardData: OrganizationsData | null
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth()
  const cookieStore = await cookies()
  const cookieSession = cookieStore.get(sessionCookieName as string)

  const token = session?.user?.accessToken
  const organizationId = session?.user?.activeOrganizationId

  if (cookieSession?.value && token) {
    if (organizationId !== currentOrganizationId) {
      currentOrganizationId = organizationId
      dashboardData = await getDashboardData(token, cookieSession?.value)
    }

    if (dashboardData) {
      const organizations: OrganizationEdge[] = dashboardData.organizations.edges
      const org = organizations.find(({ node }) => node.id === organizationId)
      return {
        title: {
          template: `${capitalizeFirstLetter(org?.node.displayName || '')} | %s`,
          default: '',
        },
      }
    }
  }

  return {
    title: {
      template: 'Openlane | %s',
      default: 'Openlane',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <DashboardLayout>{children}</DashboardLayout>
}
