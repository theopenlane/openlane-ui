import { useSession } from 'next-auth/react'
import { canManageIntegrations as hasManageIntegrations } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export const useCanManageIntegrations = () => {
  const { data: session } = useSession()
  const { data: orgPermission, isPending } = useOrganizationRoles()
  const canManageIntegrations = hasManageIntegrations(orgPermission?.roles, session)

  return { canManageIntegrations, isLoading: !canManageIntegrations && isPending }
}
