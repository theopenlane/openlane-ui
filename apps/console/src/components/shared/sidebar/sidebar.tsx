'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/hooks/useOrganization'
import SideNav, { type PanelKey, PANEL_WIDTH_PX } from './sidebar-nav/sidebar-nav'
import { type NavItem, type NavHeading, type Separator } from '@/types'

interface SidebarProps {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggle: (panel: PanelKey) => void
  onExpandToggle: () => void
}

export default function Sidebar({ navItems, footerNavItems, openPanel, expanded, onToggle, onExpandToggle }: SidebarProps) {
  const { data: session } = useSession()
  const { currentOrgId, allOrgs } = useOrganization()

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  if (session?.user?.isOnboarding) {
    return null
  }

  return <SideNav navItems={navItems} footerNavItems={footerNavItems} openPanel={openPanel} expanded={expanded} onToggleAction={onToggle} onExpandToggleAction={onExpandToggle} />
}

export { PANEL_WIDTH_PX }
export type { PanelKey }
