import ReportsAndCertificationsPage from '@/components/pages/protected/trust-center/reports-and-certifications/reports-and-certifications-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documents | Trust Center',
}

const Page: React.FC = () => {
  return (
    <>
      <ReportsAndCertificationsPage />
    </>
  )
}

export default Page
