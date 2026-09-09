import { useSession } from 'next-auth/react'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit, canView, hasPermission } from '@/lib/authz/utils'
import { type TAccessRole } from '@/lib/authz/types'
import { type AccessEnum } from '@repo/codegen/src/permissions.generated'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { deriveOrgMember } from '@/lib/authz/permission-map'
import { getPermissionStrategy } from './utils'

export type ObjectPermission = {
  roles: TAccessRole[] | undefined
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canCreate: boolean
  hasPermission: (perm: AccessEnum) => boolean
  isLoading: boolean
}

export const useObjectPermission = (objectType: ObjectTypes, id?: string | null): ObjectPermission => {
  const { data: session } = useSession()
  const useObjectPermissions = getPermissionStrategy(objectType) === 'object'
  const account = useAccountRoles(objectType, id, useObjectPermissions)
  const org = useOrganizationRoles()

  const roles = (useObjectPermissions ? account.data : org.data)?.roles
  const createMember = deriveOrgMember(objectType, 'create')

  return {
    roles,
    canView: canView(roles, session),
    canEdit: canEdit(roles, session),
    canDelete: canDelete(roles),
    canCreate: !!createMember && hasPermission(org.data?.roles, createMember, session),
    hasPermission: (perm) => hasPermission(roles, perm, session),
    isLoading: (useObjectPermissions ? account.isLoading : false) || org.isLoading,
  }
}

export const useOrgPermission = () => {
  const { data: session } = useSession()
  const org = useOrganizationRoles()
  return {
    hasPermission: (perm: AccessEnum) => hasPermission(org.data?.roles, perm, session),
    canCreate: (objectType: ObjectTypes) => {
      const member = deriveOrgMember(objectType, 'create')
      return !!member && hasPermission(org.data?.roles, member, session)
    },
    isLoading: org.isLoading,
  }
}

export const useObjectPermissionRoles = (objectType: ObjectTypes, id?: string | null): TAccessRole[] | undefined => useObjectPermission(objectType, id).roles

export const useCanEditObject = (objectType: ObjectTypes, id?: string | null): boolean => useObjectPermission(objectType, id).canEdit
