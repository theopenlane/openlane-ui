'use client'

import React from 'react'
import { useSession } from 'next-auth/react'

import { hasPermission } from '@/lib/authz/utils'
import { type AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { Loading } from '@/components/shared/loading/loading'
import ProtectedArea from '@/components/shared/protected-area/protected-area'

type TPermissionGateProps = {
  permission: AccessEnum
  children: React.ReactNode
}

const PermissionGate: React.FC<TPermissionGateProps> = ({ permission, children }) => {
  const { data: orgPermission, isLoading } = useOrganizationRoles()
  const { data: session } = useSession()

  if (isLoading) {
    return <Loading />
  }

  // Deliberately not keyed on isSuccess: when the roles request errors out after
  // its retries the query is neither loading nor successful, and gating on
  // isSuccess let the protected children render straight through. Falling back
  // to hasPermission fails closed, and it keeps the impersonation exception
  // because hasPermission short-circuits on it before looking at roles.
  if (!hasPermission(orgPermission?.roles, permission, session)) {
    return <ProtectedArea />
  }

  return <>{children}</>
}

export default PermissionGate
