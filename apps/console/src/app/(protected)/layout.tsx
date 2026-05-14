import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'
import { auth } from '@/lib/auth/auth'
import { sessionCookieName } from '@repo/dally/auth'
import { cookies } from 'next/headers'
import { getOrgDisplayNameForRequest } from '@/lib/server/dashboard-data-cache'

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth()
  const cookieStore = await cookies()
  const cookieSession = cookieStore.get(sessionCookieName as string)?.value

  const token = session?.user?.accessToken
  const organizationId = session?.user?.activeOrganizationId

  if (cookieSession && token) {
    const orgName = await getOrgDisplayNameForRequest(token, cookieSession, organizationId)
    if (orgName) {
      return {
        title: {
          template: `${orgName} | %s`,
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
