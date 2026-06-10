import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit, canView, hasPermission } from '@/lib/authz/utils'
import { type TAccessRole } from '@/types/authz'
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

// useObjectPermission resolves the current user's gating booleans for a single object.
//
// view/edit/delete are checked against the GENERIC can_view/can_edit/can_delete tokens scoped to
// the object (returned by /account/roles), while create is checked against the org-qualified
// member (e.g. can_create_control from /account/roles/organization) — these are two distinct
// vocabularies from two endpoints and must not be conflated.
export const useObjectPermission = (objectType: ObjectTypes, id?: string | null): ObjectPermission => {
  const useObjectPermissions = getPermissionStrategy(objectType) === 'object'
  const account = useAccountRoles(objectType, id, useObjectPermissions)
  const org = useOrganizationRoles()

  const roles = (useObjectPermissions ? account.data : org.data)?.roles
  const createMember = deriveOrgMember(objectType, 'create')

  return {
    roles,
    canView: canView(roles),
    canEdit: canEdit(roles),
    canDelete: canDelete(roles),
    canCreate: !!createMember && hasPermission(org.data?.roles, createMember),
    hasPermission: (perm) => hasPermission(roles, perm),
    isLoading: (useObjectPermissions ? account.isLoading : false) || org.isLoading,
  }
}

// useOrgPermission gates org-level actions that have no object id yet (create buttons, aggregate
// manage permissions). Pass an AccessEnum directly via hasPermission(), or an ObjectTypes to canCreate().
export const useOrgPermission = () => {
  const org = useOrganizationRoles()
  return {
    hasPermission: (perm: AccessEnum) => hasPermission(org.data?.roles, perm),
    canCreate: (objectType: ObjectTypes) => {
      const member = deriveOrgMember(objectType, 'create')
      return !!member && hasPermission(org.data?.roles, member)
    },
    isLoading: org.isLoading,
  }
}

// Backwards-compatible shims for existing callers — identical behavior to before.
export const useObjectPermissionRoles = (objectType: ObjectTypes, id?: string | null): TAccessRole[] | undefined => useObjectPermission(objectType, id).roles

export const useCanEditObject = (objectType: ObjectTypes, id?: string | null): boolean => useObjectPermission(objectType, id).canEdit
