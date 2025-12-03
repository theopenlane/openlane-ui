import React from 'react'
import { Metadata } from 'next'
import ComplianceFrameworksPage from '@/components/pages/protected/trust-center/compliance-frameworks/compliance-frameworks-page'

export const metadata: Metadata = {
  title: 'Compliance Frameworks | Trust center',
}

const Page: React.FC = () => {
  return <ComplianceFrameworksPage />
}

export default Page
