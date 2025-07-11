import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProceduresTable } from '@/components/pages/protected/procedures/table/procedures-table.tsx'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Procedures',
}
const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Procedures" />
      <ProceduresTable />
    </>
  )
}

export default Page
