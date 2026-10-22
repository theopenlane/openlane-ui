import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AllowedDomains from '@/components/pages/protected/organization-settings/authentication/allowed-domains'
import { type Metadata } from 'next'
import { SSOPage } from '@/components/pages/protected/organization-settings/authentication/sso'
import SupportAccess from '@/components/pages/protected/organization-settings/authentication/support-access'
import { ShieldCheck } from 'lucide-react'
import OfficialOnly from '@/components/shared/official-only/official-only'
import { SUPPORT_EMAIL, SUPPORT_EMAIL_ADDRESS } from '@/constants'

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
      <OfficialOnly>
        <div className="mt-6 rounded-lg border bg-muted/40 p-4 flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Need help? Contact Openlane support at{' '}
            <a href={SUPPORT_EMAIL} className="text-primary underline">
              {SUPPORT_EMAIL_ADDRESS}
            </a>
          </p>
        </div>
      </OfficialOnly>
    </>
  )
}

export default Page
