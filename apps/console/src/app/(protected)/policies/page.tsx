import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PoliciesTable } from '@/components/pages/protected/policies/table/policies-table.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Internal Policies" />

      <PoliciesTable />
    </>
  )
}

export default Page
