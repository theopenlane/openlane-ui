'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import SideNav, { type PanelKey, PANEL_WIDTH_PX } from './sidebar-nav/sidebar-nav'
import { type NavItem, type NavHeading, type Separator } from '@/types'

interface SidebarProps {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggle: (panel: PanelKey) => void
  onExpandToggle: () => void
  isOrganizationSelected: boolean
}

export default function Sidebar({ navItems, footerNavItems, openPanel, expanded, onToggle, onExpandToggle, isOrganizationSelected }: SidebarProps) {
  const { data: session } = useSession()

  if (session?.user?.isOnboarding) {
    return null
  }

  return (
    <SideNav
      navItems={navItems}
      footerNavItems={footerNavItems}
      openPanel={openPanel}
      expanded={expanded}
      onToggleAction={onToggle}
      onExpandToggleAction={onExpandToggle}
      isOrganizationSelected={isOrganizationSelected}
    />
  )
}

export { PANEL_WIDTH_PX }
export type { PanelKey }
