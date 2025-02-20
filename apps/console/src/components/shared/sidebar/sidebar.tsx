import React, { useState } from 'react'

import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@repo/ui/lib/utils'
import { sidebarStyles } from './sidebar.styles'
import { SideNav } from './sidebar-nav/sidebar-nav'
import { NavItems, PersonalNavItems } from '@/routes/dashboard'
import { useSession } from 'next-auth/react'
import { TaskWhereInput, UserWhereInput, useTasksWithFilterQuery } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const { isOpen } = useSidebar()
  const { currentOrgId, allOrgs } = useOrganization()

  // get user task count
  const assigneeId = session?.user.userId

  const userWhere: UserWhereInput = {
    id: assigneeId,
  }
  const whereFilter: TaskWhereInput = {
    hasAssigneeWith: [userWhere],
  }

  const [tasks] = useTasksWithFilterQuery({ variables: { where: whereFilter } })
  const userTaskCount = tasks?.data?.tasks?.edges?.length || 0

  const activeOrg = allOrgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  const isOrganizationSelected = !activeOrg?.personalOrg

  const { nav, sideNav } = sidebarStyles({
    isOpen,
  })

  return (
    <div className={cn(nav(), className)}>
      <SideNav className={sideNav()} items={isOrganizationSelected ? NavItems : PersonalNavItems} userTaskCount={userTaskCount} />
    </div>
  )
}
