import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { getSsoExemptReason, getTfaEnforcedReason, type TMemberSecurityStatus } from './member-status'

const member = (overrides: Partial<TMemberSecurityStatus> = {}): TMemberSecurityStatus => ({
  role: OrgMembershipRole.MEMBER,
  user: { email: 'someone@example.com' },
  ...overrides,
})

describe('getSsoExemptReason', () => {
  it('exempts an owner regardless of domain or flags', () => {
    expect(getSsoExemptReason(member({ role: OrgMembershipRole.OWNER }), [])).toBe('Exempt due to Owner role')
  })

  it('does not exempt an admin by role alone', () => {
    expect(getSsoExemptReason(member({ role: OrgMembershipRole.ADMIN }), [])).toBeNull()
  })

  it('exempts a member whose email domain is in the exempt list', () => {
    expect(getSsoExemptReason(member({ user: { email: 'a@vendor.io' } }), ['vendor.io'])).toBe('Exempt via domain (vendor.io)')
  })

  it('matches the exempt domain case-insensitively on both sides', () => {
    expect(getSsoExemptReason(member({ user: { email: 'a@VENDOR.IO' } }), ['Vendor.Io'])).toBe('Exempt via domain (vendor.io)')
  })

  it('does not treat a domain suffix as a match', () => {
    expect(getSsoExemptReason(member({ user: { email: 'a@notvendor.io' } }), ['vendor.io'])).toBeNull()
  })

  it('falls back to the manual flag with its custom reason', () => {
    expect(getSsoExemptReason(member({ ssoExempt: true, ssoExemptReason: 'Contractor' }), [])).toBe('Contractor')
  })

  it('uses a default wording when the manual flag carries no reason', () => {
    expect(getSsoExemptReason(member({ ssoExempt: true }), [])).toBe('Manually marked as SSO exempt')
  })

  it('prefers the owner reason over a manual flag', () => {
    expect(getSsoExemptReason(member({ role: OrgMembershipRole.OWNER, ssoExempt: true, ssoExemptReason: 'Contractor' }), [])).toBe('Exempt due to Owner role')
  })

  it('prefers the domain reason over a manual flag', () => {
    expect(getSsoExemptReason(member({ user: { email: 'a@vendor.io' }, ssoExempt: true, ssoExemptReason: 'Contractor' }), ['vendor.io'])).toBe('Exempt via domain (vendor.io)')
  })

  it('returns null for a plain member with nothing set', () => {
    expect(getSsoExemptReason(member(), [])).toBeNull()
  })

  it('survives a missing user or email', () => {
    expect(getSsoExemptReason(member({ user: null }), ['vendor.io'])).toBeNull()
    expect(getSsoExemptReason(member({ user: { email: null } }), ['vendor.io'])).toBeNull()
  })

  it('does not exempt on an email with no domain part', () => {
    expect(getSsoExemptReason(member({ user: { email: 'malformed' } }), ['vendor.io'])).toBeNull()
  })
})

describe('getTfaEnforcedReason', () => {
  it('returns the stored reason when present', () => {
    expect(getTfaEnforcedReason(member({ tfaEnforcedReason: 'Handles production data' }))).toBe('Handles production data')
  })

  it('falls back to the default wording when absent or blank', () => {
    expect(getTfaEnforcedReason(member())).toBe('Manually required to configure 2FA')
    expect(getTfaEnforcedReason(member({ tfaEnforcedReason: '' }))).toBe('Manually required to configure 2FA')
  })
})
