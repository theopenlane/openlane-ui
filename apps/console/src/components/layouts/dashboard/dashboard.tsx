'use client'

import Header from '@/components/shared/header/header'
import { dashboardStyles } from './dashboard.styles'
import Sidebar from '@/components/shared/sidebar/sidebar'
import ChatBot from '@/components/shared/chat/chat'
import { CommandMenu } from '@/components/shared/search/command'
import { NavItems } from '@/routes/dashboard'
import { useSubscriptionBanner } from '@/hooks/useSubscriptionBanner'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'

export interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { bannerText } = useSubscriptionBanner()
  const { base, main } = dashboardStyles({ hasBanner: !!bannerText })

  return (
    <div className="flex flex-col">
      {!!bannerText && (
        <div className="bg-note text-sm text-input-text flex justify-center items-center px-4 py-1 w-full">
          <span>{bannerText}</span>
          <Link href="/organization-settings/billing" className="ml-4 bg-banner text-black font-medium px-3 py-1 rounded transition-colors duration-200 flex items-center gap-2">
            <CreditCard size={9} />
            <span className="text-xs">Manage payment</span>
          </Link>
        </div>
      )}
      <Header />
      <div className={base()}>
        <Sidebar />
        <main className={main()}>{children}</main>
        <ChatBot />
        <CommandMenu items={NavItems} />
      </div>
    </div>
  )
}
