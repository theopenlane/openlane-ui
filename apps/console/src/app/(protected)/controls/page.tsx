import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'
import type { Metadata } from 'next'
import { getTitle } from '@/components/shared/title-metadata/history-metadata.ts'

export async function generateMetadata(): Promise<Metadata> {
  const orgName = 'Acme Corp'
  const breadcrumb = 'Controls'

  return {
    title: getTitle({ orgName, breadcrumb, isAuthenticated: true }),
  }
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Controls" />
      <ControlsTable />
    </>
  )
}

export default Page
