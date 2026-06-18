'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const CreatePolicyPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()

  return (
    <>
      {!isLoading && !hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy) && <ProtectedArea />}
      {!isLoading && hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
        <>
          <PageHeading heading="Create a new policy" />
          <CreatePolicyForm />
        </>
      )}
    </>
  )
}

export default CreatePolicyPage
