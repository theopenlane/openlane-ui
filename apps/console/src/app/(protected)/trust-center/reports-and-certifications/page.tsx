import React from 'react'
import { type Metadata } from 'next'
import ReportsAndCertificationsPage from '@/components/pages/protected/trust-center/reports-and-certifications/reports-and-certifications-page'

export const metadata: Metadata = {
  title: 'Reports and Certifications | Trust Center',
}

const Page: React.FC = () => {
  return <ReportsAndCertificationsPage />
}

export default Page
