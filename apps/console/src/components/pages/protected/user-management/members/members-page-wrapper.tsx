'use client'
import { PageHeading } from '@repo/ui/page-heading'
import MembersPage from './members-page'
import { Button } from '@repo/ui/button'
import { useState } from 'react'
import { useOrgMemberPermissions } from '@/lib/authz/use-org-member-permissions'
import MembersInviteSheet from './sidebar/members-invite-sheet'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { entityActionTestId } from '@/components/shared/crud-base/table/table-action-test-id'

const MembersPageWrapper = () => {
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)
  const { canInvite } = useOrgMemberPermissions()

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="user management" heading="Members" />
        {canInvite && (
          <Button variant="secondary" size="md" iconPosition="left" onClick={() => setIsMemberSheetOpen(true)} data-testid={entityActionTestId(ObjectTypes.ORG_MEMBERSHIP, 'invite')}>
            Invite member
          </Button>
        )}
      </div>
      {canInvite && <MembersInviteSheet isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />}
      <MembersPage />
    </>
  )
}

export default MembersPageWrapper
