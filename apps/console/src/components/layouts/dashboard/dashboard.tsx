'use client'

import Header from '@/components/shared/header/header'
import { dashboardStyles } from './dashboard.styles'
import ChatBot from '@/components/shared/chat/chat'
import { CommandMenu } from '@/components/shared/search/command'
import { useSubscriptionBanner } from '@/hooks/useSubscriptionBanner'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useContext } from 'react'
import SessionExpiredModal from '@/components/shared/session-expired-modal/session-expired-modal'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'
import { fromUnixTime, differenceInMilliseconds, isAfter } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { bottomNavigationItems, personalNavigationItems, topNavigationItems } from '@/routes/dashboard'
import Sidebar, { PANEL_WIDTH_PX, type PanelKey } from '@/components/shared/sidebar/sidebar'
import { NavHeading, NavItem, Separator } from '@/types'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization.ts'

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
  const pathname = usePathname()
  const { currentOrgId, allOrgs } = useOrganization()

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]
  const isOrganizationSelected = !activeOrg?.personalOrg

  const navItems = !isOrganizationSelected ? [] : topNavigationItems()
  const footerNavItems = !isOrganizationSelected ? personalNavigationItems() : bottomNavigationItems()

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const [expanded, setExpanded] = useState(true)
  const panelWidth = openPanel ? (expanded ? PANEL_WIDTH_PX : 60) : 0
  const contentMarginLeft = expanded ? 54 + panelWidth : openPanel ? 38 + panelWidth : 54 + panelWidth
  const currentActivePanel = [...navItems, ...footerNavItems]
    .filter(isNavItem)
    .find((item) => item.children?.some((child) => child.href === pathname))
    ?.title.toLowerCase() as PanelKey | undefined

  function isNavItem(item: NavItem | Separator | NavHeading): item is NavItem {
    return 'title' in item
  }

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }])
  }, [setCrumbs])

  useEffect(() => {
    if (currentActivePanel) {
      setOpenPanel(currentActivePanel)
    }
  }, [currentActivePanel])

  useEffect(() => {
    const handler = () => setShowSessionExpiredModal(true)
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

  useEffect(() => {
    if (!sessionData?.user?.refreshToken) {
      return
    }

    const decoded: { exp?: number } = jwtDecode(sessionData.user.refreshToken)
    if (!decoded.exp) {
      return
    }

    const expirationDate = fromUnixTime(decoded.exp)
    const now = new Date()

    if (isAfter(now, expirationDate)) {
      setShowSessionExpiredModal(true)
      return
    }

    const delay = differenceInMilliseconds(expirationDate, now)
    const id = setTimeout(() => setShowSessionExpiredModal(true), delay)
    return () => clearTimeout(id)
  }, [sessionData])

  const handleOpenPanel = (panel: PanelKey) => {
    setOpenPanel(panel)
  }

  return (
    <>
      <SessionExpiredModal open={showSessionExpiredModal} />
      <Sidebar
        navItems={navItems}
        footerNavItems={footerNavItems}
        openPanel={openPanel}
        expanded={expanded}
        onToggle={handleOpenPanel}
        onExpandToggle={() => setExpanded(!expanded)}
        isOrganizationSelected={isOrganizationSelected}
      />

      <div className="flex flex-col h-screen overflow-hidden transition-all duration-200" style={{ marginLeft: contentMarginLeft, marginRight: '8px' }}>
        {!!bannerText && (
          <div className="bg-note text-sm flex justify-center items-center px-4 py-1 w-full shrink-0">
            <span>{bannerText}</span>
            <Link href="/organization-settings/billing" className="ml-4 bg-banner font-medium px-3 py-1 rounded-sm transition-colors duration-200 flex items-center gap-2">
              <CreditCard size={9} />
              <span className="text-xs">Manage billing</span>
            </Link>
          </div>
        )}

        <Header />

        <div className={base()}>
          <main className={main()}>{error ?? children}</main>
          <ChatBot />
          <CommandMenu items={navItems} />
        </div>
      </div>
    </>
  )
}
