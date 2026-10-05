import type { Metadata } from 'next/types'
import ConnectedAppsPage from '@/components/pages/protected/developers/connected-apps/connected-apps-page'

export const metadata: Metadata = {
  title: 'Developers | Connected Apps',
}

const Page: React.FC = () => <ConnectedAppsPage />

export default Page
