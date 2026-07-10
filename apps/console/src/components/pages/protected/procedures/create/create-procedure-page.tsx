'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreateProcedureForm from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'

const CreateProcedurePage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  const { data: session } = useSession()
  return (
    <>
      {!isLoading && !hasPermission(permission?.roles, AccessEnum.CanCreateProcedure, session) && <ProtectedArea />}
      {!isLoading && hasPermission(permission?.roles, AccessEnum.CanCreateProcedure, session) && (
        <>
          <PageHeading heading="Create a new procedure" />
          <CreateProcedureForm />
        </>
      )}
    </>
  )
}

export default CreateProcedurePage
