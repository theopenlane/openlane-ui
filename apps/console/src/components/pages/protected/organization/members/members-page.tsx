'use client'

import { pageStyles } from './page.styles'
import { OrganizationInviteForm } from '@/components/pages/protected/organization/members/organization-invite-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useState, useContext, useEffect } from 'react'
import { MembersTable } from './members-table'
import { useGetInvites } from '@/lib/graphql-hooks/organization'
import { OrganizationInvitesTable } from './table/organization-invites-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const MembersPage: React.FC = () => {
  const { inviteCount, inviteRow } = pageStyles()
  const defaultTab = 'members'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { data } = useGetInvites({ where: {} })
  const { setCrumbs } = useContext(BreadcrumbContext)

  const numInvites = Array.isArray(data?.invites.edges) ? data?.invites.edges.length : 0

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Members', href: '/members' },
    ])
  }, [setCrumbs])

  return (
    <>
      <Tabs
        variant="solid"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
        }}
      >
        <TabsList>
          <TabsTrigger value="members">Member list</TabsTrigger>
          <TabsTrigger value="invites">
            <div className={inviteRow()}>
              <span>Invitations</span>
              {numInvites > 0 && <div className={inviteCount({ activeBg: activeTab === 'invites' })}>{numInvites}</div>}
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTable setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="invites">
          <div>
            <OrganizationInviteForm inviteAdmins={true} />
            <OrganizationInvitesTable />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default MembersPage
