'use client'
import { PageHeading } from '@repo/ui/page-heading'
import MembersPage from './members-page'
import { Button } from '@repo/ui/button'
import { useState } from 'react'

const MembersPageWrapper = () => {
  const [isMemberSheetOpen, setIsMemberSheetOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeading eyebrow="user management" heading="Members" />
        <Button variant="secondary" size="md" iconPosition="left" onClick={() => setIsMemberSheetOpen(true)}>
          Invite member
        </Button>
      </div>
      <MembersPage isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />
    </>
  )
}

export default MembersPageWrapper
