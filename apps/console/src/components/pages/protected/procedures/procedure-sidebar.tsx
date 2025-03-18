'use client'

import React, { useMemo } from 'react'
import { Procedure, User } from '@repo/codegen/src/schema'
import { UserRoundCheck, Binoculars, FileStack, ScrollText, Tag, CalendarCheck2, UserRoundPen, CalendarClock } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { MetaPanel, formatTime, MetaPanelEntry } from '@/components/shared/meta-panel/meta-panel'
import { UserChip } from '@/components/shared/user-chip/user-chip'
import { useGetUserProfile } from '@/lib/graphql-hooks/user'

type ProcedureSidebarProps = {
  procedure: Procedure
}

export const ProcedureSidebar: React.FC<ProcedureSidebarProps> = function ({ procedure }) {
  if (!procedure) return null

  const { data: createdByUser } = useGetUserProfile(procedure.createdBy)

  const { data: updatedByUser } = useGetUserProfile(procedure.updatedBy)

  const sidebarItems: Record<string, MetaPanelEntry[]> = useMemo(() => {
    return {
      // ownership: [
      //   { icon: CircleUser, label: 'Owner', value: 'owner' },
      //   { icon: UserRoundCheck, label: 'Approver', value: 'approver' },
      // ],
      status: [
        { icon: Binoculars, label: 'Status', value: procedure.status },
        { icon: ScrollText, label: 'Type', value: procedure.procedureType },
        {
          icon: Tag,
          label: 'Tags',
          align: 'top',
          value: procedure.tags?.length ? (
            procedure.tags.map((t) => (
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
        { icon: UserRoundPen, label: 'Created By', value: UserChip((createdByUser?.user as User) ?? null) },
        { icon: CalendarCheck2, label: 'Created At', value: formatTime(procedure.createdAt) },
        { icon: UserRoundCheck, label: 'Updated By', value: UserChip((updatedByUser?.user as User) ?? null) },
        { icon: CalendarClock, label: 'Updated At', value: formatTime(procedure.updatedAt) },
      ],
    }
  }, [procedure, createdByUser, updatedByUser])

  return (
    <div className="w-full flex flex-col gap-5">
      {/* <MetaPanel entries={sidebarItems.ownership} /> */}
      <MetaPanel entries={sidebarItems.status} />
      <MetaPanel entries={sidebarItems.creation} />
    </div>
  )
}
