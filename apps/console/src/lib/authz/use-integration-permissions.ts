import { useSession } from 'next-auth/react'
import { canEdit, canManageIntegrations } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export const useIntegrationPermissions = () => {
  const { data: session } = useSession()
  const { data: orgPermission, isLoading } = useOrganizationRoles()

  return {
    canEdit: canEdit(orgPermission?.roles, session),
    canRunOperations: canManageIntegrations(orgPermission?.roles, session),
    isLoading,
  }
}
