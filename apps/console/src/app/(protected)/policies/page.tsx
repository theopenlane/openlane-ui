import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PoliciesTable } from '@/components/pages/protected/policies/table/policies-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Internal Policies" />

      <PoliciesTable />
    </>
  )
}

export default Page
