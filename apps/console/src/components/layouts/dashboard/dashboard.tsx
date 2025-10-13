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
import Sidebar from '@/components/shared/sidebar/sidebar'
import { NavHeading, NavItem, Separator } from '@/types'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization.ts'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { PanelKey, PRIMARY_EXPANDED_WIDTH, PRIMARY_WIDTH, SECONDARY_COLLAPSED_WIDTH, SECONDARY_EXPANDED_WIDTH } from '@/components/shared/sidebar/sidebar-nav/sidebar-nav'

export interface DashboardLayoutProps {
  children?: React.ReactNode
  error?: React.ReactNode
}

export function DashboardLayout({ children, error }: DashboardLayoutProps) {
  const { bannerText } = useSubscriptionBanner()
  const { base, main } = dashboardStyles({ hasBanner: !!bannerText })
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const { data: sessionData } = useSession()
  const { data: orgPermission } = useOrganizationRole(sessionData)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const pathname = usePathname()
  const { currentOrgId, allOrgs } = useOrganization()

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]
  const isOrganizationSelected = !activeOrg?.personalOrg

  const navItems = !isOrganizationSelected ? [] : topNavigationItems()
  const footerNavItems = !isOrganizationSelected ? personalNavigationItems() : bottomNavigationItems(orgPermission)

  const [openPanel, setOpenPanel] = useState<PanelKey>(null)
  const [primaryExpanded, setPrimaryExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-primary-expanded') === 'true'
    }
    return false
  })

  const [secondaryExpanded, setSecondaryExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-secondary-expanded') === 'true'
    }
    return false
  })
  const primaryWidth = primaryExpanded ? PRIMARY_EXPANDED_WIDTH : PRIMARY_WIDTH
  const secondaryWidth = openPanel ? (secondaryExpanded ? SECONDARY_EXPANDED_WIDTH : SECONDARY_COLLAPSED_WIDTH) : 0

  const contentMarginLeft = primaryWidth + secondaryWidth + 4

  const currentActivePanel = [...navItems, ...footerNavItems]
    .filter(isNavItem)
    .find((item) => item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)))
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
        primaryExpanded={primaryExpanded}
        secondaryExpanded={secondaryExpanded}
        onPrimaryExpandToggle={() => {
          const newState = !primaryExpanded
          setPrimaryExpanded(newState)
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar-primary-expanded', String(newState))
          }
        }}
        onSecondaryExpandToggle={() => {
          const newState = !secondaryExpanded
          setSecondaryExpanded(newState)
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar-secondary-expanded', String(newState))
          }
        }}
        onToggle={handleOpenPanel}
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
