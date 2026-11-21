import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import { EVIDENCE_EXTENSION_ENABLED } from '@/lib/evidence-extension'
import ConnectedAppsPage from '@/components/pages/protected/developers/connected-apps/connected-apps-page'

export const metadata: Metadata = {
  title: 'Developers | Connected Apps',
}

const Page: React.FC = () => {
  if (!EVIDENCE_EXTENSION_ENABLED) {
    notFound()
  }

  return <ConnectedAppsPage />
}

export default Page
