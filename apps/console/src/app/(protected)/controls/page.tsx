import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Controls" />
      <ControlsTable />
    </>
  )
}

export default Page
