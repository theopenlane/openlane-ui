import { UserRound, UserRoundCog, UserRoundPen, UserLock, UserKey } from 'lucide-react'
import { OrgMembershipRole, UserRole } from '@repo/codegen/src/schema.ts'

export const UserRoleIconMapper: Record<UserRole | OrgMembershipRole, React.ReactNode> = {
  [UserRole.USER]: <UserRound height={16} width={16} />,
  [OrgMembershipRole.AUDITOR]: <UserRoundPen height={16} width={16} />,
  [OrgMembershipRole.ADMIN]: <UserRoundCog height={16} width={16} />,
  [OrgMembershipRole.SUPER_ADMIN]: <UserLock height={16} width={16} />,
  [OrgMembershipRole.MEMBER]: <UserRound height={16} width={16} />,
  [OrgMembershipRole.OWNER]: <UserKey height={16} width={16} />,
}
