'use client'

import React from 'react'
import { type ProcedureByIdFragment } from '@repo/codegen/src/schema'
import { CalendarCheck2, CalendarClock, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { formatTimeSince } from '@/utils/date'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'

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

  const { userMap, tokenMap } = useAuthorMaps(userIds)

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Created By */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <UserRoundCheck size={16} className="text-brand" />
          <span className="text-sm">Created By</span>
        </div>

        <div className="w-full">
          <AuthorCell id={procedure.createdBy} userMap={userMap} tokenMap={tokenMap} className="flex items-center gap-2 cursor-not-allowed text-sm" />
        </div>
      </div>

      {/* Created At */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <CalendarCheck2 size={16} className="text-brand" />
          <span className="text-sm">Created At</span>
        </div>

        <div className="w-full">
          <div className="flex gap-2 cursor-not-allowed">
            <span className="text-sm">{formatTimeSince(procedure.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Updated By */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <UserRoundPen size={16} className="text-brand" />
          <span className="text-sm">Updated By</span>
        </div>

        <div className="w-full">
          <AuthorCell id={procedure.updatedBy} userMap={userMap} tokenMap={tokenMap} className="flex items-center gap-2 cursor-not-allowed text-sm" />
        </div>
      </div>

      {/* Updated At */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <CalendarClock size={16} className="text-brand" />
          <span className="text-sm">Updated At</span>
        </div>

        <div className="w-full">
          <div className="flex gap-2 cursor-not-allowed">
            <span className="text-sm">{formatTimeSince(procedure.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertiesCard
