import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import { pageStyles } from './page.styles'
import ProfilePage from '@/components/pages/protected/profile/user-settings/profile-page'

export const metadata: Metadata = {
  title: 'Profile',
}

const Page: React.FC = () => {
  const { wrapper } = pageStyles()
  return (
    <>
      <PageHeading eyebrow="User settings" heading="My profile" />
      <div className={wrapper()}>
        <ProfilePage />
      </div>
    </>
  )
}

export default Page
