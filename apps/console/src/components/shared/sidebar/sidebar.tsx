import React, { useState } from 'react'

import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@repo/ui/lib/utils'
import { sidebarStyles } from './sidebar.styles'
import { SideNav } from './sidebar-nav/sidebar-nav'
import { NavItems, PersonalNavItems } from '@/routes/dashboard'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/hooks/useOrganization'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const { isOpen } = useSidebar()
  const { currentOrgId, allOrgs } = useOrganization()

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  const isOrganizationSelected = !activeOrg?.personalOrg

  const { nav, sideNav } = sidebarStyles({
    isOpen,
  })

  if (session?.user?.isOnboarding) {
    return null
  }

  return (
    <div className={cn(nav(), className)}>
      <SideNav className={sideNav()} items={isOrganizationSelected ? NavItems : PersonalNavItems} />
    </div>
  )
}
