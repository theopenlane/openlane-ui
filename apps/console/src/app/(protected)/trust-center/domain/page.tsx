import React from 'react'
import { Metadata } from 'next'
import DomainSettingsPage from '@/components/pages/protected/trust-center/branding/domain-settings-page'
export const metadata: Metadata = {
  title: 'Domain | Trust center',
}

const Page: React.FC = () => {
  return (
    <>
      <DomainSettingsPage />
    </>
  )
}

export default Page
