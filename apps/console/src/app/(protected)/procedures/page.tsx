import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProceduresTable } from '@/components/pages/protected/procedures/table/procedures-table.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Procedures" />

      <ProceduresTable />
    </>
  )
}

export default Page
