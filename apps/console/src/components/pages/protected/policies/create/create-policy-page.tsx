'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

const CreatePolicyPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  const { data: session } = useSession()
  const canViewPage = hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy) || session?.user?.isImpersonation

  return (
    <>
      {!isLoading && !canViewPage && <ProtectedArea />}
      {!isLoading && canViewPage && (
        <>
          <PageHeading heading="Create a new policy" />
          <CreatePolicyForm />
        </>
      )}
    </>
  )
}

export default CreatePolicyPage
