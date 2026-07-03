'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { OrganizationNameForm } from '@/components/pages/protected/organization-settings/general-settings/organization-name-form'
import { pageStyles } from './page.styles'
import { OrganizationManagement } from '@/components/pages/protected/organization-settings/general-settings/organization-management'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { canEdit } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

export const PageWrapper: React.FC = () => {
  const { wrapper } = pageStyles()
  const [loading, setLoading] = useState(false)
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canView = canEdit(orgPermission?.roles, session)
  return (
    <>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <LoaderCircle className="animate-spin" size={48} />
        </div>
      )}
      {!loading && !canView && <ProtectedArea />}
      {!loading && canView && (
        <>
          <PageHeading eyebrow="Organization settings" heading="General" />
          <div className={wrapper()}>
            <OrganizationNameForm />
            <OrganizationManagement onLoadingChange={setLoading} />
          </div>
        </>
      )}
    </>
  )
}
