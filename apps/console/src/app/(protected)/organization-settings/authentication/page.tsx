import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllowedDomains from '@/components/pages/protected/organization-settings/authentication/allowed-domains'
import { type Metadata } from 'next'
import { SSOPage } from '@/components/pages/protected/organization-settings/authentication/sso'
import SupportAccess from '@/components/pages/protected/organization-settings/authentication/support-access'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Authentication Settings',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Authentication" />
      <p className="text-sm text-muted-foreground -mt-4 mb-4">Manage how users access and join your organization</p>
      <div className="flex gap-[26px] flex-col">
        <AllowedDomains />
        <SSOPage />
        <SupportAccess />
      </div>
      <div className="mt-6 rounded-lg border bg-muted/40 p-4 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Need help? Contact Openlane support at{' '}
          <a href="mailto:support@theopenlane.io" className="text-primary underline">
            support@theopenlane.io
          </a>
        </p>
      </div>
    </>
  )
}

export default Page
