import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllowedDomains from '@/components/pages/protected/organization/authentication/allowed-domains'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Authentication" /> <AllowedDomains />
    </>
  )
}

export default Page
