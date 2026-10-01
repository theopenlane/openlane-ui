import type { Metadata } from 'next/types'
import ExtensionConnectPage from '@/components/pages/protected/extension-connect/extension-connect-page'

export const metadata: Metadata = {
  title: 'Connect Evidence Capture Extension',
}

const Page: React.FC = () => <ExtensionConnectPage />

export default Page
