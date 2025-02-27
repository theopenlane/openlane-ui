'use client'

import React, { useMemo } from 'react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { UserRoundCheck, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, UserRoundPen, CalendarClock } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { useGetUserProfileQuery } from '@repo/codegen/src/schema'
import { UserChip } from '@/components/shared/user-chip/user-chip'

type PolicySidebarProps = {
  policy: InternalPolicyByIdFragment
}

export const PolicySidebar: React.FC<PolicySidebarProps> = function ({ policy }) {
  if (!policy) return null

  const [{ data: createdByUser }] = useGetUserProfileQuery({
    variables: { userId: policy.createdBy || '' },
    pause: !policy.createdBy,
  })

  const [{ data: updatedByUser }] = useGetUserProfileQuery({
    variables: { userId: policy.updatedBy || '' },
    pause: !policy.updatedBy,
  })

  const sidebarItems = useMemo(() => {
    return {
      // ownership: [
      //   { icon: CircleUser, label: 'Owner', value: 'owner' },
      //   { icon: UserRoundCheck, label: 'Approver', value: 'approver' },
      // ],
      status: [
        { icon: Binoculars, label: 'Status', value: policy.status },
        { icon: FileStack, label: 'Version', value: policy.version },
        { icon: ScrollText, label: 'Type', value: policy.policyType },
        {
          icon: Tag,
          label: 'Tags',
          value: policy.tags?.length ? (
            policy.tags.map((t) => (
              <Badge key={t} variant="outline" className="mr-1">
                {t}
              </Badge>
            ))
          ) : (
            <span className="italic text-text-dimmed">none</span>
          ),
        },
      ],
      creation: [
        { icon: UserRoundPen, label: 'Created By', value: UserChip(createdByUser?.user ?? null) },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(policy.createdAt) },
        { icon: UserRoundCheck, label: 'Updated By', value: UserChip(updatedByUser?.user ?? null) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(policy.updatedAt) },
      ],
    }
  }, [policy, createdByUser, updatedByUser])

  return (
    <div className="w-full flex flex-col gap-5">
      {/* <MetaPanel entries={sidebarItems.ownership} /> */}
      <MetaPanel entries={sidebarItems.status} />
      <MetaPanel entries={sidebarItems.creation} />
    </div>
  )
}
