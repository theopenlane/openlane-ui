'use client'

import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission, isImpersonation } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'

export const NO_SCAN_PERMISSION_REASON = "You don't have permission to run scans. Ask an organization admin for access."

export const SCAN_PERMISSION_UNKNOWN_REASON = "We couldn't check your permissions. Please try again later."

export const useCanCreateScan = () => {
  const { data: session } = useSession()
  const { data: orgPermission, isPending, isError } = useOrganizationRoles()

  return {
    canCreateScan: hasPermission(orgPermission?.roles, AccessEnum.CanCreateScan, session),
    isCheckingPermission: !isImpersonation(session) && isPending,
    isPermissionError: !isImpersonation(session) && isError,
  }
}
