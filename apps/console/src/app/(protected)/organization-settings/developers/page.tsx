import DevelopersPage from '@/components/pages/protected/developers/developers-user-page'
import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'

export const metadata: Metadata = {
  title: 'Developers',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Developers" />
      <DevelopersPage />
    </>
  )
}

export default Page
