'use client'

import React from 'react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { CircleUser, UserRoundCheck, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, UserRoundPen, CalendarClock } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'

type PolicySidebarProps = {
  policy: InternalPolicyByIdFragment
}

export const PolicySidebar: React.FC<PolicySidebarProps> = function ({ policy }) {
  const sidebarItems = {
    ownership: [
      { icon: CircleUser, label: 'Owner', value: 'owner' },
      { icon: UserRoundCheck, label: 'Approver', value: 'approver' },
    ],
    status: [
      { icon: Binoculars, label: 'Status', value: policy.status },
      { icon: FileStack, label: 'Version', value: policy.version },
      { icon: ScrollText, label: 'Type', value: policy.policyType },
      {
        icon: Tag,
        label: 'Tags',
        value: policy.tags?.length ? (
          policy.tags.map((t) => (
            <Badge variant="outline" className="mr-1">
              {t}
            </Badge>
          ))
        ) : (
          <span className="italic">none</span>
        ),
      },
    ],
    creation: [
      { icon: UserRoundPen, label: 'Created By', value: policy.createdBy },
      { icon: CalendarCheck2, label: 'Created At', value: formatTime(policy.createdAt) },
      { icon: UserRoundCheck, label: 'Updated By', value: policy.updatedBy },
      { icon: CalendarClock, label: 'Updated At', value: formatTime(policy.updatedAt) },
    ],
  }

  return (
    <div className="flex flex-col gap-5">
      <MetaPanel entries={sidebarItems.ownership} />
      <MetaPanel entries={sidebarItems.status} />
      <MetaPanel entries={sidebarItems.creation} />
    </div>
  )
}
