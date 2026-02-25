'use client'

import { headerStyles } from './header.styles'
import { UserMenu } from '@/components/shared/user-menu/user-menu'
import { BreadcrumbNavigation } from '@/components/shared/breadcrumb-nav/breadcrumb'
import { sidebarStyles } from '../sidebar/sidebar.styles'
import { useSidebar } from '@/hooks/useSidebar'
import React, { useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import SystemNotificationTracker from '@/components/shared/SystemNotification/SystemNotification.tsx'

type ActivePanel = 'notifications' | 'user-menu' | null

export default function Header() {
  const { isOpen } = useSidebar()
  const [status] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)

  const handleNotificationsOpenChange = useCallback((open: boolean) => {
    setActivePanel(open ? 'notifications' : null)
  }, [])

  const handleUserMenuOpenChange = useCallback((open: boolean) => {
    setActivePanel(open ? 'user-menu' : null)
  }, [])

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
            <UserMenu open={activePanel === 'user-menu'} onOpenChange={handleUserMenuOpenChange} />
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
            <SystemNotificationTracker open={activePanel === 'notifications'} onOpenChange={handleNotificationsOpenChange} />
            <UserMenu open={activePanel === 'user-menu'} onOpenChange={handleUserMenuOpenChange} />
          </div>
        </nav>
      </div>
    </>
  )
}
