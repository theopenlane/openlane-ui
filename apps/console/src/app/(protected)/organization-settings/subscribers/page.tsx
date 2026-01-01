import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import SubscribersPage from '@/components/pages/protected/organization-settings/subscribers/subscribers-page'

export const metadata: Metadata = {
  title: 'Subscribers',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Organization settings" heading="Subscribers" />
      <SubscribersPage />
    </>
  )
}

export default Page
