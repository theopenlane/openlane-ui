import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { type TAccessRole } from '@/types/authz'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { getPermissionStrategy } from './utils'
import { type Session } from 'next-auth'

export const useObjectPermissionRoles = (objectType: ObjectTypes, id?: string | null): TAccessRole[] | undefined => {
  const useObjectPermissions = getPermissionStrategy(objectType) === 'object'
  const { data: objectPermission } = useAccountRoles(objectType, id, useObjectPermissions)
  const { data: orgPermission } = useOrganizationRoles()
  return (useObjectPermissions ? objectPermission : orgPermission)?.roles
}

export const useCanEditObject = (objectType: ObjectTypes, id?: string | null, session?: Session | null): boolean => {
  return canEdit(useObjectPermissionRoles(objectType, id), session)
}
