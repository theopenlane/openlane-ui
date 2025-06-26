import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'

export const metadata: Metadata = {
  title: {
    template: 'Acme Corp: | %s',
    default: 'Acme',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <DashboardLayout>{children}</DashboardLayout>
}
