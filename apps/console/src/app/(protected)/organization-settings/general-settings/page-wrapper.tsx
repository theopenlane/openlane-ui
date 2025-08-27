'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { OrganizationNameForm } from '@/components/pages/protected/organization/general-settings/organization-name-form'
import { pageStyles } from './page.styles'
import { OrganizationDelete } from '@/components/pages/protected/organization/general-settings/organization-delete'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

export const PageWrapper: React.FC = () => {
  const { wrapper } = pageStyles()
  const [loading, setLoading] = useState(false)

  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <LoaderCircle className="animate-spin" size={48} />
        </div>
      )}
      <PageHeading eyebrow="Organization settings" heading="General" />
      <div className={wrapper()}>
        <OrganizationNameForm />
        <OrganizationDelete onLoadingChange={setLoading} />
      </div>
    </>
  )
}
