'use client'

import { pageStyles } from './page.styles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useState, useContext, useEffect } from 'react'
import { MembersTable } from './members-table'
import { useGetInvites } from '@/lib/graphql-hooks/organization'
import { OrganizationInvitesTable } from './table/organization-invites-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import MembersInviteSheet from './sidebar/members-invite-sheet'

type TMembersPage = {
  isMemberSheetOpen: boolean
  setIsMemberSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const MembersPage = ({ isMemberSheetOpen, setIsMemberSheetOpen }: TMembersPage) => {
  const { inviteCount, inviteRow } = pageStyles()
  const defaultTab = 'members'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { data } = useGetInvites({ where: {} })
  const { setCrumbs } = useContext(BreadcrumbContext)

  const numInvites = Array.isArray(data?.invites.edges) ? data?.invites.edges.length : 0

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'User Management' }, { label: 'Members', href: '/user-management/members' }])
  }, [setCrumbs])

  return (
    <>
      <Tabs
        variant="underline"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
        }}
      >
        <div className="flex flex-row items-center mb-3">
          <div className="w-2/5">
            <TabsList>
              <TabsTrigger value="members">Member List</TabsTrigger>
              <TabsTrigger value="invites">
                <div className={inviteRow()}>
                  <span>Awaiting Response</span>
                  {numInvites > 0 && <div className={inviteCount({ activeBg: true })}>{numInvites}</div>}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="members">
          <MembersTable />
        </TabsContent>
        <TabsContent value="invites">
          <OrganizationInvitesTable />
        </TabsContent>
      </Tabs>
      <MembersInviteSheet isMemberSheetOpen={isMemberSheetOpen} setIsMemberSheetOpen={setIsMemberSheetOpen} />
    </>
  )
}

export default MembersPage
