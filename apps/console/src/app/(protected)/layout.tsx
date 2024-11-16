import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'The open source foundation for your Security and Compliance needs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return <DashboardLayout>{children}</DashboardLayout>
}
