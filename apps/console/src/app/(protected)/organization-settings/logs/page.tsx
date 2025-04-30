import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import LogsPage from '@/components/pages/protected/organization/logs/logs-page.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Audit Logs" eyebrow="Organization Settings" />
      <LogsPage />
    </>
  )
}

export default Page
