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
import { useEffect, useState, useContext } from 'react'
import SessionExpiredModal from '@/components/shared/session-expired-modal/session-expired-modal'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'
import { fromUnixTime, differenceInMilliseconds, isAfter } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export interface DashboardLayoutProps {
  children?: React.ReactNode
  error?: React.ReactNode
}

export function DashboardLayout({ children, error }: DashboardLayoutProps) {
  const { bannerText } = useSubscriptionBanner()
  const { base, main } = dashboardStyles({ hasBanner: !!bannerText })
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const { data: sessionData } = useSession()
  const { setCrumbs } = useContext(BreadcrumbContext)
  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

  useEffect(() => {
    const handler = () => {
      setShowSessionExpiredModal(true)
    }

    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

  useEffect(() => {
    if (!sessionData?.user?.refreshToken) return

    const decoded: { exp?: number } = jwtDecode(sessionData.user.refreshToken)

    if (!decoded.exp) return

    const expirationDate = fromUnixTime(decoded.exp)
    const now = new Date()

    if (isAfter(now, expirationDate)) {
      setShowSessionExpiredModal(true)
      return
    }

    const delay = differenceInMilliseconds(expirationDate, now)
    const id = setTimeout(() => {
      setShowSessionExpiredModal(true)
    }, delay)

    return () => clearTimeout(id)
  }, [sessionData])

  return (
    <>
      <SessionExpiredModal open={showSessionExpiredModal} />
      <div className="flex flex-col">
        {!!bannerText && (
          <div className="bg-note text-sm text-input-text flex justify-center items-center px-4 py-1 w-full">
            <span>{bannerText}</span>
            <Link href="/organization-settings/billing" className="ml-4 bg-banner text-black font-medium px-3 py-1 rounded-sm transition-colors duration-200 flex items-center gap-2">
              <CreditCard size={9} />
              <span className="text-xs">Manage billing</span>
            </Link>
          </div>
        )}
        <Header />
        <div className={base()}>
          <Sidebar />
          <main className={main()}>{error ?? children}</main>
          <ChatBot />
          <CommandMenu items={NavItems} />
        </div>
      </div>
    </>
  )
}
