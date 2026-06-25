import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllowedDomains from '@/components/pages/protected/organization-settings/authentication/allowed-domains'
import { type Metadata } from 'next'
import { SSOPage } from '@/components/pages/protected/organization-settings/authentication/sso'
import SSOExemptDomains from '@/components/pages/protected/organization-settings/authentication/sso-exempt-domains'
import SupportAccess from '@/components/pages/protected/organization-settings/authentication/support-access'

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
        <SSOExemptDomains />
        <SupportAccess />
      </div>
    </>
  )
}

export default Page
