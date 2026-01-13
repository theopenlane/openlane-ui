import BrandingPage from '@/components/pages/protected/trust-center/settings/brand-settings-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Branding',
}

const Page: React.FC = () => {
  return (
    <>
      <BrandingPage />
    </>
  )
}

export default Page
