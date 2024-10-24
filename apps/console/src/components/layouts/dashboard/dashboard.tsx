'use client'

import Header from '@/components/shared/header/header'
import { dashboardStyles } from './dashboard.styles'
import Sidebar from '@/components/shared/sidebar/sidebar'

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { base, main } = dashboardStyles()

  return (
    <>
      <Header />
      <div className={base()}>
        <Sidebar />
        <main className={main()}>{children}</main>
      </div>
    </>
  )
}
