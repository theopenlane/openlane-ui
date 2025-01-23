import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import MyGroupsTable from '@/components/pages/protected/groups/my-groups/my-groups-table'
import CreateGroupDialog from './create-group-dialog'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="My Groups" />
      <CreateGroupDialog />
      <MyGroupsTable />
    </>
  )
}

export default Page
