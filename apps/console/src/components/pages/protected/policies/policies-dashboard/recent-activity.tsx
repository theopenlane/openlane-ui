'use client'

import React, { useMemo, useState } from 'react'
import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/internal-policy'
import { wherePoliciesDashboard } from './dashboard-config'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'
import { AuthorDisplay } from '@/components/shared/user-display/author-cell'
import { resolveAuthor } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { ViewPolicySheet } from '@/components/pages/protected/policies/view-policy-sheet'

const RecentActivity = () => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
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

  const { userMap, tokenMap } = useAuthorMaps(userIds)

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
          const author = resolveAuthor(userId, { userMap, tokenMap })
          const action = isCreated ? 'created' : 'updated'
          const timestamp = isCreated ? policy.createdAt : policy.updatedAt
          const formattedDate = formatDate(timestamp)
          return (
            <li key={policy.id} className={cn('flex justify-between items-center border-b pb-2 last:border-b-0 cursor-pointer')} onClick={() => setSelectedPolicyId(policy.id)}>
              <div className="flex-1 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm flex items-center gap-1">
                    <strong>{policy.name}</strong> was {action} by
                    <AuthorDisplay author={author} className="flex items-center gap-1" />
                  </span>
                </div>
                <span className="text-sm text-text-informational">{formattedDate}</span>
              </div>
            </li>
          )
        })}
      </ul>

      <ViewPolicySheet policyId={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />
    </div>
  )
}

export default RecentActivity
