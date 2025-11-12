import React from 'react'
import { Metadata } from 'next'
import ReportsAndCertificationsPage from '@/components/pages/protected/trust-center/reports-and-certifications/reports-and-certifications-page'

export const metadata: Metadata = {
  title: 'Reports and Certifications | Trust center',
}

const Page: React.FC = () => {
  return <ReportsAndCertificationsPage />
}

export default Page
