import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit, isImpersonation } from '@/lib/authz/utils'

export const useApiTokenAccessReason = (deniedReason: string) => {
  const { data: session } = useSession()
  const { data: permission, isPending, isError } = useOrganizationRoles()

  if (isImpersonation(session)) return undefined
  if (isPending) return 'Checking your access…'
  if (isError) return 'Your access could not be checked. Please try again later.'
  return canEdit(permission?.roles, session) ? undefined : deniedReason
}

export const useConnectedAppConnectReason = (deniedReason: string) => {
  const { data: session } = useSession()
  const accessReason = useApiTokenAccessReason(deniedReason)

  return isImpersonation(session) ? 'Support sessions cannot connect apps, because the access token would outlive the session.' : accessReason
}
