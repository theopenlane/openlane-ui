import { useSession } from 'next-auth/react'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { hasPermission } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export const useHasOrgFullAccess = (): boolean => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()

  return hasPermission(orgPermission?.roles, AccessEnum.FullAccess, session)
}
