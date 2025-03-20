import type { Metadata } from 'next'
import { DashboardLayout } from '@/components/layouts/dashboard/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'The open source foundation of a sustainable digital world',
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return <DashboardLayout>{children}</DashboardLayout>
}
