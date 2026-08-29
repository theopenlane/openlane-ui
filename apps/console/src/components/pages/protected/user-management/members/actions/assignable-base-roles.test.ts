import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { ASSIGNABLE_BASE_ROLES } from './assignable-base-roles'

/**
 * #2132 — AUDITOR became assignable; it was previously filtered out alongside OWNER. OWNER is
 * transferred rather than assigned and the *_USER pseudo-roles are internal, so both stay out.
 */
describe('ASSIGNABLE_BASE_ROLES', () => {
  test('includes AUDITOR', () => {
    expect(ASSIGNABLE_BASE_ROLES).toContain(OrgMembershipRole.AUDITOR)
  })

  test('includes the everyday roles', () => {
    expect(ASSIGNABLE_BASE_ROLES).toContain(OrgMembershipRole.ADMIN)
    expect(ASSIGNABLE_BASE_ROLES).toContain(OrgMembershipRole.MEMBER)
  })

  test('never offers OWNER, which is transferred rather than assigned', () => {
    expect(ASSIGNABLE_BASE_ROLES).not.toContain(OrgMembershipRole.OWNER)
  })

  test('excludes every internal *_USER pseudo-role', () => {
    expect(ASSIGNABLE_BASE_ROLES.filter((role) => role.includes('USER'))).toEqual([])
  })

  test('contains no duplicates', () => {
    expect(new Set(ASSIGNABLE_BASE_ROLES).size).toBe(ASSIGNABLE_BASE_ROLES.length)
  })

  test('is a strict subset of the backend role enum', () => {
    const known = new Set<string>(Object.values(OrgMembershipRole))

    for (const role of ASSIGNABLE_BASE_ROLES) {
      expect(known.has(role)).toBe(true)
    }
    expect(ASSIGNABLE_BASE_ROLES.length).toBeLessThan(known.size)
  })
})
