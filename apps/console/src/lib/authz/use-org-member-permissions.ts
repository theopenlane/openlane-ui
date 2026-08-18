import { useSession } from 'next-auth/react'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canEdit, hasPermission, isSupportSession } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

export type TOrgMemberPermissions = {
  isLoading: boolean
  canManageMembers: boolean
  canInviteMembers: boolean
  canInviteAdmins: boolean
  canInvite: boolean
}

export const useOrgMemberPermissions = (): TOrgMemberPermissions => {
  const { data: session } = useSession()
  const { data: orgPermission, isLoading } = useOrganizationRoles()

  if (isSupportSession(session)) {
    return { isLoading: false, canManageMembers: false, canInviteMembers: false, canInviteAdmins: false, canInvite: false }
  }

  const roles = orgPermission?.roles
  const canInviteMembers = hasPermission(roles, AccessEnum.CanInviteMembers, session)
  const canInviteAdmins = hasPermission(roles, AccessEnum.CanInviteAdmins, session)

  return {
    isLoading,
    canManageMembers: canEdit(roles, session),
    canInviteMembers,
    canInviteAdmins,
    canInvite: canInviteMembers || canInviteAdmins,
  }
}
