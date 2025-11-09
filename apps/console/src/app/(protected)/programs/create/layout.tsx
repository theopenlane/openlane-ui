'use client'
import React from 'react'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Loading } from '@/components/shared/loading/loading'

const CreateProgramLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: orgPermission, isSuccess, isLoading } = useOrganizationRoles()

  if (isLoading) {
    return <Loading />
  }
  if (isSuccess && orgPermission && !canCreate(orgPermission.roles, AccessEnum.CanCreateProgram)) {
    return <ProtectedArea />
  }
  return <div>{children}</div>
}

export default CreateProgramLayout
