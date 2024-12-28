'use client'

import Header from '@/components/shared/header/header'
import { dashboardStyles } from './dashboard.styles'
import Sidebar from '@/components/shared/sidebar/sidebar'
import ChatBot from '@/components/shared/chat/chat'
import { CommandMenu } from '@/components/shared/search/command'

export interface DashboardLayoutProps {
  children: React.ReactNode
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { base, main } = dashboardStyles();


  return (
    <div className="flex flex-col">
      <Header />
      <div className={base()}>
        <Sidebar />
        <main className={main()}>{children}</main>
        <ChatBot />
        <CommandMenu />
      </div>
    </div>
  );
}
