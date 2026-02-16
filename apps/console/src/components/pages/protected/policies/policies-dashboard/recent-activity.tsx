'use client'

import React, { useMemo } from 'react'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/internal-policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'
import { Avatar } from '@/components/shared/avatar/avatar'
import { User } from '@repo/codegen/src/schema'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import Link from 'next/link'

const RecentActivity = () => {
  const { policies } = useInternalPoliciesDashboard({
    where: wherePoliciesDashboard,
  })

  const recentPolicies = useMemo(() => policies.slice(0, 5), [policies])

  const userIds = useMemo(() => {
    if (!recentPolicies) return []

    const ids = new Set<string>()
    recentPolicies.forEach((policy) => {
      if (policy.createdBy) ids.add(policy.createdBy)
      if (policy.updatedBy) ids.add(policy.updatedBy)
    })

    return Array.from(ids)
  }, [recentPolicies])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  if (!recentPolicies?.length) {
    return <p className="text-sm text-muted-foreground">No recent activity</p>
  }

  return (
    <div className="rounded-2xl flex-1">
      <h2 className="text-lg mb-7 font-medium">Recent Activity</h2>

      <ul className="space-y-4">
        {recentPolicies.map((policy) => {
          const isCreated = policy.createdAt === policy.updatedAt
          const userId = isCreated ? policy.createdBy : policy.updatedBy
          const user = users.find((u) => u?.id === userId)
          const userName = user?.displayName || 'Unknown user'
          const action = isCreated ? 'created' : 'updated'
          const timestamp = isCreated ? policy.createdAt : policy.updatedAt
          const formattedDate = formatDate(timestamp)
          const policyLink = `/policies/${policy.id}/view`
          return (
            <li key={policy.id} className={cn('flex justify-between items-center border-b pb-2 last:border-b-0')}>
              <Link href={policyLink} className="flex-1 flex justify-between items-center no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-sm flex items-center">
                    <strong>{policy.name}</strong> &nbsp;was {action} by&nbsp;
                    <Avatar entity={user as User}></Avatar>
                    &nbsp;{userName}
                  </span>
                </div>
                <span className="text-sm text-text-informational">{formattedDate}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RecentActivity
