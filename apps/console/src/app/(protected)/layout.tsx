import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { getDashboardData } from '../api/getDashboardData/route'
import { cookies } from 'next/headers'

interface OrganizationNode {
  id: string
  displayName: string
}

interface OrganizationEdge {
  node: OrganizationNode
}

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth()
  const cookieStore = await cookies()
  const cookieSession = cookieStore.get(sessionCookieName as string)

  const token = session?.user?.accessToken
  const organizationId = session?.user?.activeOrganizationId

  if (!session) {
    return {
      title: {
        template: 'Openlane: %s',
        default: '',
      },
    }
  }
  const dashboardData = await getDashboardData(token, cookieSession?.value!)

  const organizations: OrganizationEdge[] = dashboardData.organizations.edges
  const org = organizations.find(({ node }) => node.id === organizationId)

  return {
    title: {
      template: `${org?.node.displayName}: %s`,
      default: '',
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <DashboardLayout>{children}</DashboardLayout>
}
