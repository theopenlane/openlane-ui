'use client'

import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { sidebarStyles } from '../sidebar/sidebar.styles'
import { useSidebar } from '@/hooks/useSidebar'
import React, { useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { GlobalSearch } from '../search/search'
import NavTriangle from '@/assets/NavTriangle'
import SystemNotificationTracker from '@/components/shared/SystemNotification/SystemNotification.tsx'

export default function Header() {
  const { isOpen, toggle } = useSidebar()
  const [status, setStatus] = useState(false)

  const path = usePathname()
  const { header, nav, mobileSidebar, userNav } = headerStyles()
  const { expandNav } = sidebarStyles({
    status,
    isOpen,
  })

  const handleToggle = () => {
    setStatus(true)
    toggle()
    setTimeout(() => setStatus(false), 500)
  }

  if (path === '/onboarding') {
    return (
      <div className={header()}>
        <nav className={nav()}>
          <div className="flex justify-start items-center">
            <OrganizationSelector />
          </div>
          <div className={userNav()}>
            <UserMenu />
          </div>
        </nav>
      </div>
    )
  }

  return (
    <>
      <div className={header()}>
        <nav className={nav()}>
          <div className={expandNav({ isOpen: !isOpen })}>
            <OrganizationSelector />
            <NavTriangle size={31} className="text-border -ml-5" />

            <PanelLeft height={16} width={16} onClick={handleToggle} className="cursor-pointer" />
            <div className="border-l h-4" />
            <div className="flex justify-start items-center">
              <div className={mobileSidebar()}>
                <>MobileSidebar</>
              </div>

              <div className="pl-2.5">
                <BreadcrumbNavigation />
              </div>
            </div>
          </div>

          <div className={userNav()}>
            <GlobalSearch />
            <SystemNotificationTracker />
            <UserMenu />
          </div>
        </nav>
      </div>
    </>
  )
}
