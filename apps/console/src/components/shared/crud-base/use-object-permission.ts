import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { type TAccessRole } from '@/types/authz'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { getPermissionStrategy } from './utils'
import { type Session } from 'next-auth'

export const useObjectPermission = (objectType: ObjectTypes, id?: string | null): { roles: TAccessRole[] | undefined; isLoading: boolean } => {
  const useObjectPermissions = getPermissionStrategy(objectType) === 'object'
  const objectPermission = useAccountRoles(objectType, id, useObjectPermissions)
  const orgPermission = useOrganizationRoles()
  const { data, isLoading } = useObjectPermissions ? objectPermission : orgPermission
  return { roles: data?.roles, isLoading }
}

export const useObjectPermissionRoles = (objectType: ObjectTypes, id?: string | null): TAccessRole[] | undefined => useObjectPermission(objectType, id).roles

export const useCanEditObject = (objectType: ObjectTypes, id?: string | null, session?: Session | null): boolean => {
  return canEdit(useObjectPermissionRoles(objectType, id), session)
}
