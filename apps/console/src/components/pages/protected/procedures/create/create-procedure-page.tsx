'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreateProcedureForm from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'
import { useSession } from 'next-auth/react'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canCreate } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

const CreateProcedurePage: React.FC = () => {
  const { data: session } = useSession()
  const { data: permission, isLoading } = useOrganizationRole(session)
  return (
    <>
      {!isLoading && !canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && <ProtectedArea />}
      {!isLoading && canCreate(permission?.roles, AccessEnum.CanCreateProcedure) && (
        <>
          <PageHeading heading="Create a new procedure" />
          <CreateProcedureForm />
        </>
      )}
    </>
  )
}

export default CreateProcedurePage
