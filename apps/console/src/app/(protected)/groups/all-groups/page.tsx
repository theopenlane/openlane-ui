import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllGroupsTable from '@/components/pages/protected/groups/all-groups/all-groups-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Groups" heading="All Groups" />
      <AllGroupsTable />
    </>
  )
}

export default Page
