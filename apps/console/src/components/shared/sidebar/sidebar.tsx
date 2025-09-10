import React from 'react'

import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@repo/ui/lib/utils'
import { sidebarStyles } from './sidebar.styles'
import { SideNav } from './sidebar-nav/sidebar-nav'
import { generateNavItems, PersonalNavItems } from '@/routes/dashboard'
import { useOrganization } from '@/hooks/useOrganization'
import { usePathname } from 'next/navigation'
// import { useOrganizationRole } from '@/lib/authz/access-api'
// import { canEdit } from '@/lib/authz/utils'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { isOpen } = useSidebar()
  const { currentOrgId, allOrgs } = useOrganization()
  const path = usePathname()

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  const isOrganizationSelected = !activeOrg?.personalOrg

  const { nav, sideNav } = sidebarStyles({
    isOpen,
  })

  if (path === '/onboarding') {
    return null
  }

  const navItems = generateNavItems()

  return (
    <div className={cn(nav(), className)}>
      <SideNav className={sideNav()} items={isOrganizationSelected ? navItems : PersonalNavItems} />
    </div>
  )
}
