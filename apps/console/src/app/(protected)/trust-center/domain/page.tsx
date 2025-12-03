import React from 'react'
import { Metadata } from 'next'
import DomainSettingsPage from '@/components/pages/protected/trust-center/settings/domain-settings-page'
import { PageHeading } from '@repo/ui/page-heading'
export const metadata: Metadata = {
  title: 'Domain | Trust center',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Domain settings" />
      <DomainSettingsPage />
    </>
  )
}

export default Page
