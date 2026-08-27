import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export const useCanEditRows = (): boolean => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()

  return canEdit(orgPermission?.roles, session)
}
