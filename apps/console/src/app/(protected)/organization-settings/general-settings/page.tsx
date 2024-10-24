import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import { OrganizationNameForm } from '@/components/pages/protected/organization/general-settings/organization-name-form'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { pageStyles } from './page.styles'
import { OrganizationEmailForm } from '@/components/pages/protected/organization/general-settings/organization-email-form'
import { OrganizationDelete } from '@/components/pages/protected/organization/general-settings/organization-delete'

export const metadata: Metadata = {
  title: 'Organization settings',
}

const Page: React.FC = () => {
  const { wrapper } = pageStyles()
  return (
    <>
      <PageHeading eyebrow="Organization settings" heading="General" />
      <div className={wrapper()}>
        <OrganizationNameForm />
        <AvatarUpload />
        <OrganizationEmailForm />
        <OrganizationDelete />
      </div>
    </>
  )
}

export default Page
