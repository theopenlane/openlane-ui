import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import MembersPage from '@/components/pages/protected/organization/members/members-page'

export const metadata: Metadata = {
  title: 'Members',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Organization settings" heading="Members" />
      <MembersPage />
    </>
  )
}

export default Page
