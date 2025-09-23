'use client'

import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { sidebarStyles } from '../sidebar/sidebar.styles'
import { useSidebar } from '@/hooks/useSidebar'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import SystemNotificationTracker from '@/components/shared/SystemNotification/SystemNotification.tsx'

export default function Header() {
  const { isOpen } = useSidebar()
  const [status] = useState(false)

  const path = usePathname()
  const { header, nav, userNav } = headerStyles()
  const { expandNav } = sidebarStyles({
    status,
    isOpen,
  })

  if (path === '/onboarding') {
    return (
      <div className={header()}>
        <nav className={nav()}>
          <div className="flex justify-start items-center"></div>
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
            <div className="flex justify-start items-center">
              <div className="pl-2.5">
                <BreadcrumbNavigation />
              </div>
            </div>
          </div>

          <div className={userNav()}>
            <SystemNotificationTracker />
            <UserMenu />
          </div>
        </nav>
      </div>
    </>
  )
}
