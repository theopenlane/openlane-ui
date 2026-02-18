import type { Metadata } from 'next/types'
import MembersPageWrapper from '@/components/pages/protected/user-management/members/members-page-wrapper'

export const metadata: Metadata = {
  title: 'Members',
}

const Page: React.FC = () => {
  return <MembersPageWrapper />
}

export default Page
