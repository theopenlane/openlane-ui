import { type TAccessRole } from '@/types/authz'
import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { OrgMembershipRole } from '@repo/codegen/src/schema'

export const hasPermission = (accessRole: TAccessRole[] | undefined, accessEnum: AccessEnum) => {
  return accessRole ? accessRole.includes(accessEnum) : false
}

export const canDelete = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanDelete) : false
}

export const canView = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanView) : false
}

export const canEdit = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanEdit) : false
}

export const isOwnerOrSuperAdmin = (role?: OrgMembershipRole | null) => {
  return role === OrgMembershipRole.OWNER || role === OrgMembershipRole.SUPER_ADMIN
}
