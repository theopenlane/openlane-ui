import ReportsAndCertificationsPage from '@/components/pages/protected/trust-center/reports-and-certifications/reports-and-certifications-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documents',
}

const Page: React.FC = () => {
  return (
    <>
      <ReportsAndCertificationsPage />
    </>
  )
}

export default Page
