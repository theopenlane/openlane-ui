import { OrgMembershipRole } from '@repo/codegen/src/schema'

export const ASSIGNABLE_BASE_ROLES: OrgMembershipRole[] = Object.values(OrgMembershipRole).filter(
  (role) => role !== OrgMembershipRole.OWNER && !role.includes('USER') && role !== OrgMembershipRole.AUDITOR,
)
