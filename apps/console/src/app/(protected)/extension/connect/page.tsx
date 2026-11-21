import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import { EVIDENCE_EXTENSION_ENABLED } from '@/lib/evidence-extension'
import ExtensionConnectPage from '@/components/pages/protected/extension-connect/extension-connect-page'

export const metadata: Metadata = {
  title: 'Connect Evidence Capture Extension',
}

const Page: React.FC = () => {
  if (!EVIDENCE_EXTENSION_ENABLED) {
    notFound()
  }

  return <ExtensionConnectPage />
}

export default Page
