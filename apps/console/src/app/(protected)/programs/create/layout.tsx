'use client'
import React from 'react'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Loading } from '@/components/shared/loading/loading'
import { useSession } from 'next-auth/react'

const CreateProgramLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: orgPermission, isSuccess, isLoading } = useOrganizationRoles()

  const { data: session } = useSession()
  const canViewPage = orgPermission && hasPermission(orgPermission.roles, AccessEnum.CanCreateProgram, session)

  if (isLoading) {
    return <Loading />
  }
  if (isSuccess && !canViewPage) {
    return <ProtectedArea />
  }
  return <div>{children}</div>
}

export default CreateProgramLayout
