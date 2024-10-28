import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { pageStyles } from './page.styles'
import { ProfileNameForm } from '@/components/pages/protected/profile/user-settings/profile-name-form'

export const metadata: Metadata = {
  title: 'Organization settings',
}

const Page: React.FC = () => {
  const { wrapper } = pageStyles()
  return (
    <>
      <PageHeading eyebrow="User settings" heading="My profile" />
      <div className={wrapper()}>
        <ProfileNameForm />
        <AvatarUpload />
      </div>
    </>
  )
}

export default Page
