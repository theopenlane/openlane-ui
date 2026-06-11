'use client'

import React from 'react'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { CalendarCheck2, CalendarClock, UserRoundCheck, UserRoundPen } from 'lucide-react'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import AuthorBadge from '@/components/shared/user-display/author-badge'
import { isUlid } from '@/lib/validators'

type TPropertiesCardProps = {
  policy: InternalPolicyByIdFragment
}

const PropertiesCard: React.FC<TPropertiesCardProps> = ({ policy }) => {
  const createdById = policy?.createdBy && isUlid(policy.createdBy) ? policy.createdBy : undefined
  const updatedById = policy?.updatedBy && isUlid(policy.updatedBy) ? policy.updatedBy : undefined
  const userIds = [createdById, updatedById].filter((id): id is string => !!id)
  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })
  const { tokens } = useGetApiTokensByIds({ where: { idIn: userIds } })
  const updatedByToken = tokens?.find((item) => item.id === updatedById)
  const updatedByUser = users?.find((item) => item.id === updatedById)
  const createdByToken = tokens?.find((item) => item.id === createdById)
  const createdByUser = users?.find((item) => item.id === createdById)

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
            <AuthorBadge user={createdByUser} token={createdByToken} fallback={createdById ? undefined : '—'} />
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
            <AuthorBadge user={updatedByUser} token={updatedByToken} fallback={updatedById ? undefined : '—'} />
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
