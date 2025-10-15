'use client'
import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import CreateRiskForm from '@/components/pages/protected/risks/create/form/create-risk-form.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const CreateRiskPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  const { setCrumbs } = React.useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Risks', href: '/risks' },
    ])
  }, [setCrumbs])

  return (
    <>
      {!isLoading && !canCreate(permission?.roles, AccessEnum.CanCreateRisk) && <ProtectedArea />}
      {!isLoading && canCreate(permission?.roles, AccessEnum.CanCreateRisk) && (
        <>
          <PageHeading heading="Create a new risk" />
          <CreateRiskForm />
        </>
      )}
    </>
  )
}

export default CreateRiskPage
