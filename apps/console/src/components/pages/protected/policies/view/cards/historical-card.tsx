'use client'

import React from 'react'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { CalendarCheck2, CalendarClock, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { formatTimeSince } from '@/utils/date'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { AuthorCell } from '@/components/shared/user-display/author-cell'

type TPropertiesCardProps = {
  policy: InternalPolicyByIdFragment
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ policy }) => {
  const { userMap, tokenMap } = useAuthorMaps([policy?.createdBy, policy?.updatedBy])

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Created By */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="flex gap-2 min-w-40 items-center">
          <UserRoundCheck size={16} className="text-brand" />
          <span className="text-sm">Created By</span>
        </div>

        <div className="w-full">
          <div className="flex gap-2 cursor-not-allowed text-sm">
            <AuthorCell id={policy?.createdBy} userMap={userMap} tokenMap={tokenMap} />
          </div>
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
            <span className="text-sm">{formatTimeSince(policy.createdAt)}</span>
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
          <div className="flex gap-2 cursor-not-allowed text-sm">
            <AuthorCell id={policy?.updatedBy} userMap={userMap} tokenMap={tokenMap} />
          </div>
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
            <span className="text-sm">{formatTimeSince(policy.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertiesCard
