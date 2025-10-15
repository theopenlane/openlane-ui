'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const CreatePolicyPage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()

  return (
    <>
      {!isLoading && !canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && <ProtectedArea />}
      {!isLoading && canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
        <>
          <PageHeading heading="Create a new policy" />
          <CreatePolicyForm />
        </>
      )}
    </>
  )
}

export default CreatePolicyPage
