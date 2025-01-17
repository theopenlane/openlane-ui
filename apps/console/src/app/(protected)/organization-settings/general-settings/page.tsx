import { PageHeading } from '@repo/ui/page-heading'
import type { Metadata } from 'next/types'
import { OrganizationNameForm } from '@/components/pages/protected/organization/general-settings/organization-name-form'
import { pageStyles } from './page.styles'
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
        <OrganizationDelete />
      </div>
    </>
  )
}

export default Page
