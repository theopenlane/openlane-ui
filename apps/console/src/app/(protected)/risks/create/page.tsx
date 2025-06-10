'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { useSession } from 'next-auth/react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import CreateRiskForm from '@/components/pages/protected/risks/create/form/create-risk-form.tsx'

const Page: React.FC = () => {
  const { data: session } = useSession()
  const { data: permission, isLoading } = useOrganizationRole(session)

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

export default Page
