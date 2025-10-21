// 'use client'

// import React from 'react'

// export default function RecentActivity() {
//   const activities = [
//     { text: 'Password Expiration Policy updated', time: '2 hours ago' },
//     { text: 'User Access was modified', time: 'Jan 7, 2024' },
//     { text: 'System Backup was edited by Sarah Hedrik', time: 'Jan 8, 2024' },
//   ]

//   return (
//     <div className="rounded-2xl flex-1">
//       <h2 className="text-lg mb-7">Recent Activity</h2>
//       <ul className="space-y-4">
//         {activities.map(({ text, time }) => (
//           <li key={text} className="flex justify-between items-center border-b pb-2 last:border-b-0">
//             <span className="text-sm">{text}</span>
//             <span className="text-sm text-text-informational">{time}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }

'use client'

import { useInternalPoliciesDashboard } from '@/lib/graphql-hooks/policy'
import React from 'react'
import { wherePoliciesDashboard } from './dashboard-config'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'

const RecentActivity = () => {
  const { policies } = useInternalPoliciesDashboard({
    where: wherePoliciesDashboard,
    enabled: true,
  })

  if (!policies?.length) {
    return <p className="text-sm text-muted-foreground">No recent activity</p>
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => {
        const isCreated = policy.createdAt === policy.updatedAt
        const user = isCreated ? policy.createdBy || 'Unknown user' : policy.updatedBy || 'Unknown user'
        const action = isCreated ? 'Created' : 'Updated'
        const timestamp = isCreated ? policy.createdAt : policy.updatedAt
        const formattedDate = formatDate(timestamp)

        return (
          <div key={policy.id} className={cn('flex items-center justify-between border rounded-lg p-3 hover:bg-muted transition-colors')}>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium leading-none">{policy.name}</p>
                <p className="text-xs text-muted-foreground">
                  {action} by {user}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
        )
      })}
    </div>
  )
}

export default RecentActivity
