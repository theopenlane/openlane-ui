import { type TAccessRole } from '@/types/authz'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { type Session } from 'next-auth'

export const hasPermission = (accessRole: TAccessRole[] | undefined, accessEnum: AccessEnum, session?: Session | null) => {
  if (isImpersonation(session)) {
    return true
  }

  return accessRole ? accessRole.includes(accessEnum) : false
}

export const canDelete = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanDelete) : false
}

export const canView = (accessRole: TAccessRole[] | undefined, session?: Session | null) => {
  if (isImpersonation(session)) {
    return true
  }

  return accessRole ? accessRole.includes(AccessEnum.CanView) : false
}

export const canEdit = (accessRole: TAccessRole[] | undefined, session?: Session | null) => {
  if (isImpersonation(session)) {
    return true
  }

  return accessRole ? accessRole.includes(AccessEnum.CanEdit) : false
}

export const isOwnerOrSuperAdmin = (role?: OrgMembershipRole | null) => {
  return role === OrgMembershipRole.OWNER || role === OrgMembershipRole.SUPER_ADMIN
}

export const isImpersonation = (session?: Session | null) => {
  const isImpersonation = session?.user?.isImpersonation

  return isImpersonation
}
