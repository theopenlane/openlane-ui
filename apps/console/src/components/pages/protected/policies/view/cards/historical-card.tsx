'use client'

import React from 'react'
import { ApiToken, InternalPolicyByIdFragment, User } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CalendarCheck2, CalendarClock, KeyRound, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'

type TPropertiesCardProps = {
  policy: InternalPolicyByIdFragment
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ policy }) => {
  const userIds = []
  if (policy?.updatedBy) {
    userIds.push(policy.updatedBy)
  }
  if (policy?.createdBy) {
    userIds.push(policy.createdBy)
  }
  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })
  const { tokens } = useGetApiTokensByIds({ where: { idIn: userIds } })
  const updatedByToken = tokens?.find((item) => item.id === policy?.updatedBy)
  const updatedByUser = users?.find((item) => item.id === policy?.updatedBy)
  const createdByToken = tokens?.find((item) => item.id === policy?.createdBy)
  const createdByUser = users?.find((item) => item.id === policy?.createdBy)

  const handleUserDisplay = (token?: ApiToken, user?: User) => {
    if (!token && !user) {
      return 'Deleted user'
    }

    return (
      <>
        {token ? <KeyRound size={16} /> : <Avatar entity={user} variant="small" />}
        {token ? token.name : user?.displayName || '—'}
      </>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">Historical</h3>
      <div className="flex flex-col gap-4">
        {/* Created By */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <UserRoundCheck size={16} className="text-brand" />
            <span>Created By</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2">{handleUserDisplay(createdByToken, createdByUser)}</div>
          </div>
        </div>

        {/* Created At */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <CalendarCheck2 size={16} className="text-brand" />
            <span>Created At</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2">
              <span>{formatTimeSince(policy.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Updated By */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <UserRoundPen size={16} className="text-brand" />
            <span>Updated By</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2">{handleUserDisplay(updatedByToken, updatedByUser)}</div>
          </div>
        </div>

        {/* Updated At */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <CalendarClock size={16} className="text-brand" />
            <span>Updated At</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2">
              <span>{formatTimeSince(policy.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PropertiesCard
