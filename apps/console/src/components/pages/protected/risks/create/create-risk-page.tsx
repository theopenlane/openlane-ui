'use client'
import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import CreateRiskForm from '@/components/pages/protected/risks/create/form/create-risk-form.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

const CreateRiskPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  const { data: session } = useSession()
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Exposure', href: '/exposure/overview' },
      { label: 'Risks', href: '/exposure/risks' },
    ])
  }, [setCrumbs])

  return (
    <>
      {!isLoading && !hasPermission(permission?.roles, AccessEnum.CanCreateRisk, session) && <ProtectedArea />}
      {!isLoading && hasPermission(permission?.roles, AccessEnum.CanCreateRisk, session) && (
        <>
          <PageHeading heading="Create a new risk" />
          <CreateRiskForm />
        </>
      )}
    </>
  )
}

export default CreateRiskPage
