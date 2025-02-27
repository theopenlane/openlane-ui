'use client'

import React, { useMemo } from 'react'
import { InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { UserRoundCheck, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, UserRoundPen, CalendarClock } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { MetaPanel, formatTime } from '@/components/shared/meta-panel/meta-panel'
import { useGetUserProfileQuery } from '@repo/codegen/src/schema'
import { UserChip } from '@/components/shared/user-chip/user-chip'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'

type PolicyEditSidebarProps = {
  policy: InternalPolicyByIdFragment
  handleSave: () => void
}

export const PolicyEditSidebar: React.FC<PolicyEditSidebarProps> = function ({ policy, handleSave }) {
  if (!policy) return null

  const sidebarItems = useMemo(() => {
    return {
      status: [
        { icon: Binoculars, label: 'Status', value: policy.status },
        { icon: FileStack, label: 'Version', value: policy.version },
        { icon: ScrollText, label: 'Policy Type', value: policy.policyType },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(policy.createdAt) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(policy.updatedAt) },
      ],
    }
  }, [policy])

  return (
    <div className="w-full flex flex-col gap-5">
      <Button onClick={handleSave}>Save policy</Button>
      <MetaPanel entries={sidebarItems.status} />
      <Panel>
        <h1>
          <Tag />
          Tags
        </h1>
        <input placeholder="Choose existing or add tag..."></input>
      </Panel>
    </div>
  )
}
