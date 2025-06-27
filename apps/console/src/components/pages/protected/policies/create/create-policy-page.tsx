'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'
import { useSession } from 'next-auth/react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

const CreatePolicyPage: React.FC = () => {
  const { data: session } = useSession()
  const { data: permission, isLoading } = useOrganizationRole(session)

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
