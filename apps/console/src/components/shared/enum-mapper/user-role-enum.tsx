import { User, UserCog, UserStar } from 'lucide-react'
import { OrgMembershipRole, UserRole } from '@repo/codegen/src/schema.ts'

export const UserRoleIconMapper: Record<UserRole | OrgMembershipRole, React.ReactNode> = {
  [UserRole.USER]: <User height={16} width={16} />,
  [UserRole.ADMIN]: <UserCog height={16} width={16} />,
  [UserRole.MEMBER]: <User height={16} width={16} />,
  [OrgMembershipRole.OWNER]: <UserStar height={16} width={16} />,
  // [OrgMembershipRole.AUDITOR]: <UserPen height={16} width={16} />,
  // [OrgMembershipRole.SUPER_ADMIN]: <UserKey height={16} width={16} />,
}
