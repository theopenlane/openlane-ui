'use client'

import React, { useMemo } from 'react'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'
import { useGetUsers } from '@/lib/graphql-hooks/user'
import { Avatar } from '@/components/shared/avatar/avatar'
import { User } from '@repo/codegen/src/schema'

const RecentActivity = () => {
  const { policies } = useInternalPoliciesDashboard({
    where: wherePoliciesDashboard,
  })

  const recentPolicies = useMemo(() => policies.slice(0, 5), [policies])

  const userIds = useMemo(() => {
    const ids = new Set<string>()
    recentPolicies?.forEach((p) => {
      if (p.createdBy) ids.add(p.createdBy)
      if (p.updatedBy) ids.add(p.updatedBy)
    })
    return Array.from(ids)
  }, [recentPolicies])

  const { data: userData } = useGetUsers({
    idIn: userIds.length ? userIds : undefined,
  })

  const users = userData?.users?.edges?.map((edge) => edge?.node) ?? []

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

          return (
            <li key={policy.id} className={cn('flex justify-between items-center border-b pb-2 last:border-b-0')}>
              <div className="flex items-center gap-3">
                <span className="text-sm flex items-center">
                  <strong>{policy.name}</strong> &nbsp;was {action} by&nbsp;
                  <Avatar entity={user as User}></Avatar>
                  &nbsp;{userName}
                </span>
              </div>
              <span className="text-sm text-text-informational">{formattedDate}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RecentActivity
