'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { OrganizationNameForm } from '@/components/pages/protected/organization-settings/general-settings/organization-name-form'
import { pageStyles } from './page.styles'
import { OrganizationManagement } from '@/components/pages/protected/organization-settings/general-settings/organization-management'
import { use, useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { canEdit } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Loading } from '@/components/shared/loading/loading'
import { useSession } from 'next-auth/react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export const PageWrapper: React.FC = () => {
  const { wrapper } = pageStyles()
  const [loading, setLoading] = useState(false)
  const { data: orgPermission, isPending } = useOrganizationRoles()
  const { data: session } = useSession()
  const { setCrumbs } = use(BreadcrumbContext)
  const canView = canEdit(orgPermission?.roles, session)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'General Settings', href: '/organization-settings/general-settings' },
    ])
  }, [setCrumbs])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <LoaderCircle className="animate-spin" size={48} />
      </div>
    )
  }

  if (!canView) {
    return isPending ? <Loading /> : <ProtectedArea />
  }

  return (
    <>
      <PageHeading eyebrow="Organization Settings" heading="General" />
      <div className={wrapper()}>
        <OrganizationNameForm />
        <OrganizationManagement onLoadingChange={setLoading} />
      </div>
    </>
  )
}
