'use client'

import React from 'react'
import { Callout } from '@/components/shared/callout/callout'
import { useSession } from 'next-auth/react'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { AddSelectDropdown } from '../../shared/steps/team-setup-step'
import { type SourceProgram } from '../from-existing-types'

type TeamStepProps = {
  sourceProgram?: SourceProgram
  droppedMemberCount: number
}

const TeamStep = ({ sourceProgram, droppedMemberCount }: TeamStepProps) => {
  const { data: session } = useSession()
  const currentUserID = session?.user?.userId
  const { userOptions } = useUserSelect({ where: { not: { userID: currentUserID } }, enabled: !!currentUserID })
  const { groupOptions } = useGroupSelect()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium">Team</h2>
        <p className="text-sm text-muted-foreground">The admins, members and groups from {sourceProgram?.name || 'the copied program'} are carried over. Add or remove anyone before creating.</p>
      </div>

      {droppedMemberCount > 0 && (
        <Callout variant="warning" compact>
          {`${droppedMemberCount} member${droppedMemberCount === 1 ? '' : 's'} of ${sourceProgram?.name ?? 'the copied program'} ${
            droppedMemberCount === 1 ? 'is' : 'are'
          } no longer in this organization and could not be carried over.`}
        </Callout>
      )}

      <div className="space-y-6">
        <AddSelectDropdown fieldName="programAdmins" formLabel="Program Admins" placeholder="Search users..." options={userOptions} />
        <AddSelectDropdown fieldName="programMembers" formLabel="Program Members" placeholder="Search users..." options={userOptions} />
        <AddSelectDropdown fieldName="programAuditors" formLabel="Program Auditors" placeholder="Search users..." options={userOptions} />
        <AddSelectDropdown fieldName="editorIDs" formLabel="Groups with Edit Access" placeholder="Search groups..." options={groupOptions} />
        <AddSelectDropdown fieldName="viewerIDs" formLabel="Groups with Read Only Access" placeholder="Search groups..." options={groupOptions} />
      </div>
    </div>
  )
}

export default TeamStep
