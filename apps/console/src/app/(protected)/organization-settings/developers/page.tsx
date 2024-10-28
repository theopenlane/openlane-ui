import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import DevelopersPage from '@/components/pages/protected/developers/developers-organization-page'

export const metadata: Metadata = {
  title: 'Organization settings',
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
