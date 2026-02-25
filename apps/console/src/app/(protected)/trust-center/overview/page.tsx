import OverviewPage from '@/components/pages/protected/trust-center/overview/overview-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overview | Trust Center',
}

const Page: React.FC = () => {
  return <OverviewPage />
}

export default Page
