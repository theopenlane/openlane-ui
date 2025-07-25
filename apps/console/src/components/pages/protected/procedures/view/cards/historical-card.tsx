'use client'

import React from 'react'
import { ApiToken, ProcedureByIdFragment, User } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { CalendarCheck2, CalendarClock, KeyRound, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'

type TPropertiesCardProps = {
  procedure: ProcedureByIdFragment
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ procedure }) => {
  const userIds = []
  if (procedure?.updatedBy) {
    userIds.push(procedure.updatedBy)
  }
  if (procedure?.createdBy) {
    userIds.push(procedure.createdBy)
  }

  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })
  const { tokens } = useGetApiTokensByIds({ where: { idIn: userIds } })
  const updatedByToken = tokens?.find((item) => item.id === procedure?.updatedBy)
  const updatedByUser = users?.find((item) => item.id === procedure?.updatedBy)
  const createdByToken = tokens?.find((item) => item.id === procedure?.createdBy)
  const createdByUser = users?.find((item) => item.id === procedure?.createdBy)

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
            <div className="flex gap-2 cursor-not-allowed">{handleUserDisplay(createdByToken, createdByUser)}</div>
          </div>
        </div>

        {/* Created At */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <CalendarCheck2 size={16} className="text-brand" />
            <span>Created At</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2 cursor-not-allowed">
              <span>{formatTimeSince(procedure.createdAt)}</span>
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
            <div className="flex gap-2 cursor-not-allowed">{handleUserDisplay(updatedByToken, updatedByUser)}</div>
          </div>
        </div>

        {/* Updated At */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 w-[160px] items-center">
            <CalendarClock size={16} className="text-brand" />
            <span>Updated At</span>
          </div>

          <div className="w-[220px]">
            <div className="flex gap-2 cursor-not-allowed">
              <span>{formatTimeSince(procedure.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PropertiesCard
