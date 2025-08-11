'use client'
import { PageHeading } from '@repo/ui/page-heading'
import MembersPage from './members-page'
import { Button } from '@repo/ui/button'
import { useState } from 'react'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { useSession } from 'next-auth/react'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

const MembersPageWrapper = () => {
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)
  const { data: session } = useSession()

  const { data: permissions } = useOrganizationRole(session)

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="Organization settings" heading="Members" />
        {canCreate(permissions?.roles, AccessEnum.CanInviteAdmins) && (
          <Button size="md" iconPosition="left" onClick={() => setIsMemberSheetOpen(true)}>
            Invite member
          </Button>
        )}
      </div>
      <MembersPage isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />
    </>
  )
}

export default MembersPageWrapper
