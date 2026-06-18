'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreateProcedureForm from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const CreateProcedurePage: React.FC = () => {
  const { data: permission, isLoading } = useOrganizationRoles()
  return (
    <>
      {!isLoading && !hasPermission(permission?.roles, AccessEnum.CanCreateProcedure) && <ProtectedArea />}
      {!isLoading && hasPermission(permission?.roles, AccessEnum.CanCreateProcedure) && (
        <>
          <PageHeading heading="Create a new procedure" />
          <CreateProcedureForm />
        </>
      )}
    </>
  )
}

export default CreateProcedurePage
