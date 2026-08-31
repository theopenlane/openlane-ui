import { OrgMembershipRole } from '@repo/codegen/src/schema'

const SSO_EXEMPT_ROLES = [OrgMembershipRole.OWNER]

export type TMemberSecurityStatus = {
  role: OrgMembershipRole
  ssoExempt?: boolean | null
  ssoExemptReason?: string | null
  tfaEnforced?: boolean | null
  tfaEnforcedReason?: string | null
  user?: { email?: string | null } | null
}

export const getSsoExemptReason = (member: TMemberSecurityStatus, exemptDomains: string[]): string | null => {
  if (SSO_EXEMPT_ROLES.includes(member.role)) return 'Exempt due to Owner role'
  const emailDomain = member.user?.email?.split('@')[1]?.toLowerCase()
  if (emailDomain && exemptDomains.some((d) => d.toLowerCase() === emailDomain)) return `Exempt via domain (${emailDomain})`
  if (member.ssoExempt) return member.ssoExemptReason || 'Manually marked as SSO exempt'
  return null
}

export const getTfaEnforcedReason = (member: TMemberSecurityStatus): string => member.tfaEnforcedReason || 'Manually required to configure 2FA'
