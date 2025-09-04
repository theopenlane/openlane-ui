import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllowedDomains from '@/components/pages/protected/organization/authentication/allowed-domains'
import { Metadata } from 'next'
import { SSOPage } from '@/components/pages/protected/organization/authentication/sso'

export const metadata: Metadata = {
  title: 'Authentication Settings',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Authentication" />
      <div className="flex gap-[26px] flex-col">
        <AllowedDomains />
        <SSOPage />
      </div>
    </>
  )
}

export default Page
