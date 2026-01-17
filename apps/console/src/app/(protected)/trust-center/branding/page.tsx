import BrandingPage from '@/components/pages/protected/trust-center/branding/branding-page'
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
