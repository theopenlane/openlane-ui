import OverviewPage from '@/components/pages/protected/trust-center/overview/overview-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overview',
}

const Page: React.FC = () => {
  return <OverviewPage />
}

export default Page
