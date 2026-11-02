import { useSession } from 'next-auth/react'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canEdit, hasPermission, isImpersonation } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export type TOrgMemberPermissions = {
  isLoading: boolean
  canManageMembers: boolean
  canInviteMembers: boolean
  canInviteAdmins: boolean
  canInvite: boolean
  canDeleteInvites: boolean
}

export const useOrgMemberPermissions = (): TOrgMemberPermissions => {
  const { data: session } = useSession()
  const { data: orgPermission, isLoading } = useOrganizationRoles()

  if (isImpersonation(session)) {
    return { isLoading: false, canManageMembers: false, canInviteMembers: true, canInviteAdmins: false, canInvite: true, canDeleteInvites: true }
  }

  const roles = orgPermission?.roles
  const canInviteMembers = hasPermission(roles, AccessEnum.CanInviteMembers, session)
  const canInviteAdmins = hasPermission(roles, AccessEnum.CanInviteAdmins, session)
  const canManageMembers = canEdit(roles, session)

  return {
    isLoading,
    canManageMembers,
    canInviteMembers,
    canInviteAdmins,
    canInvite: canInviteMembers || canInviteAdmins,
    canDeleteInvites: canManageMembers,
  }
}
