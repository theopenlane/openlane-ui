import React from 'react'
import { Metadata } from 'next'
import TrustCenterSettingsPage from '@/components/pages/protected/trust-center/branding/trust-center-settings-page'
export const metadata: Metadata = {
  title: 'Settings | Trust center',
}

const Page: React.FC = () => {
  return (
    <>
      <TrustCenterSettingsPage />
    </>
  )
}

export default Page
