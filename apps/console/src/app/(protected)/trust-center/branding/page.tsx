import BrandingPage from '@/components/pages/protected/trust-center/branding/branding-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Branding | Trust Center',
}

const Page: React.FC = () => {
  return <BrandingPage />
}

export default Page
