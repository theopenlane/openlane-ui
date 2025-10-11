'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import SideNav, { type PanelKey } from './sidebar-nav/sidebar-nav'
import { type NavItem, type NavHeading, type Separator } from '@/types'

interface SidebarProps {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  primaryExpanded: boolean
  secondaryExpanded: boolean
  onPrimaryExpandToggle: () => void
  onSecondaryExpandToggle: () => void
  onToggle: (panel: PanelKey) => void
  isOrganizationSelected: boolean
}

export default function Sidebar({
  navItems,
  footerNavItems,
  openPanel,
  primaryExpanded,
  secondaryExpanded,
  onPrimaryExpandToggle,
  onSecondaryExpandToggle,
  onToggle,
  isOrganizationSelected,
}: SidebarProps) {
  const { data: session } = useSession()
  if (session?.user?.isOnboarding) return null

  return (
    <SideNav
      navItems={navItems}
      footerNavItems={footerNavItems}
      openPanel={openPanel}
      primaryExpanded={primaryExpanded}
      secondaryExpanded={secondaryExpanded}
      onPrimaryExpandToggle={onPrimaryExpandToggle}
      onSecondaryExpandToggle={onSecondaryExpandToggle}
      onToggleAction={onToggle}
      isOrganizationSelected={isOrganizationSelected}
    />
  )
}
