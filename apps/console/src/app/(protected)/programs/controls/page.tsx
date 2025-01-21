import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ControlsTable from '@/components/pages/protected/program/controls/controls-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Control List"></PageHeading>
      <ControlsTable />
    </>
  )
}

export default Page
