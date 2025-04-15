import React, { useState } from 'react'

import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@repo/ui/lib/utils'
import { sidebarStyles } from './sidebar.styles'
import { SideNav } from './sidebar-nav/sidebar-nav'
import { NavItems, PersonalNavItems } from '@/routes/dashboard'
import { useSession } from 'next-auth/react'
import { TaskWhereInput, UserWhereInput } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { usePathname } from 'next/navigation'
import { useTasksWithFilter } from '@/lib/graphql-hooks/tasks'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const { isOpen } = useSidebar()
  const { currentOrgId, allOrgs } = useOrganization()
  const path = usePathname()

  // get user task count
  const assigneeId = session?.user.userId

  const userWhere: UserWhereInput = {
    id: assigneeId,
  }
  const whereFilter: TaskWhereInput = {
    hasAssigneeWith: [userWhere],
  }

  const { data } = useTasksWithFilter({ where: whereFilter })
  const userTaskCount = data?.tasks?.edges?.length || 0

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  const isOrganizationSelected = !activeOrg?.personalOrg

  const { nav, sideNav } = sidebarStyles({
    isOpen,
  })

  if (session?.user.isOnboarding) {
    return null
  }

  return (
    <div className={cn(nav(), className)}>
      <SideNav className={sideNav()} items={isOrganizationSelected ? NavItems : PersonalNavItems} userTaskCount={userTaskCount} />
    </div>
  )
}
