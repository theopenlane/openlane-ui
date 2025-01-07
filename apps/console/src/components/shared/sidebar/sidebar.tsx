import React, { useState } from 'react'

import { useSidebar } from '@/hooks/useSidebar'
import { ArrowLeft, MenuIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { sidebarStyles } from './sidebar.styles'
import { SideNav } from './sidebar-nav/sidebar-nav'
import { NavItems, PersonalNavItems } from '@/routes/dashboard'
import { useSession } from 'next-auth/react'
import { useGetAllOrganizationsQuery, TaskWhereInput, UserWhereInput, useTasksWithFilterQuery } from '@repo/codegen/src/schema'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const { isOpen, toggle } = useSidebar()
  const [status, setStatus] = useState(false)
  const currentOrgId = session?.user.activeOrganizationId
  const [allOrgs] = useGetAllOrganizationsQuery({ pause: !session })
  const orgs = allOrgs.data?.organizations.edges || []

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

  const activeOrg = orgs.filter((org) => org?.node?.id === currentOrgId).map((org) => org?.node)[0]

  const isOrganizationSelected = !activeOrg?.personalOrg

  const { nav, sideNav, expandNav, expandNavIcon } = sidebarStyles({
    status,
    isOpen,
  })

  const handleToggle = () => {
    setStatus(true)
    toggle()
    setTimeout(() => setStatus(false), 500)
  }

  return (
    <div className={cn(nav(), className)}>
      <div className={expandNav({ isOpen: !isOpen })} onClick={handleToggle}>
        <MenuIcon strokeWidth={3} width={18} />
        <ArrowLeft className={expandNavIcon()} strokeWidth={3} width={18} />
      </div>
      <SideNav className={sideNav()} items={isOrganizationSelected ? NavItems : PersonalNavItems} userTaskCount={userTaskCount} />
    </div>
  )
}
