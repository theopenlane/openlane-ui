import ExposureOverviewPage from '@/components/pages/protected/exposure/overview/exposure-overview-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exposure Overview',
}

const ExposureOverviewRoute = () => <ExposureOverviewPage />
export default ExposureOverviewRoute
