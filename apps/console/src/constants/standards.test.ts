import {
  EXCLUDE_SYSTEM_FRAMEWORK_CONTROLS_WHERE,
  EXCLUDE_SYSTEM_STANDARDS_WHERE,
  isSystemStandardRecord,
  OPENLANE_BASELINE_STANDARD,
  OPENLANE_SYSTEM_FRAMEWORKS,
  OPENLANE_TRUST_CENTER_STANDARD,
  TEMPLATE_CONTROLS_WHERE,
} from './standards'

/**
 * ISS-2603 — Openlane ships two system-owned standards (OL Baseline and OTS)
 * that must be hidden from org-facing lists while staying reachable through
 * their own routes.
 *
 * The subtle part is SQL, not TypeScript: a bare `frameworkNotIn [...]` silently
 * drops rows whose framework is NULL, because NULL NOT IN (...) is NULL, not
 * true. Every exclusion clause therefore has to be an OR with an IsNil branch —
 * without it, custom standards with no framework vanish from the list. These
 * assertions exist to stop that OR being "simplified" away.
 */
describe('system standard exclusion clauses', () => {
  test('excluding system standards keeps records with a null framework', () => {
    expect(EXCLUDE_SYSTEM_STANDARDS_WHERE.or).toEqual([{ frameworkIsNil: true }, { frameworkNotIn: OPENLANE_SYSTEM_FRAMEWORKS }])
  })

  test('excluding system framework controls keeps records with a null referenceFramework', () => {
    const branches = EXCLUDE_SYSTEM_FRAMEWORK_CONTROLS_WHERE.or

    expect(branches?.[0]).toEqual({ referenceFrameworkIsNil: true })
    expect(branches?.[1]).toHaveProperty('referenceFrameworkNotIn')
  })

  test('both system frameworks are covered by the exclusion list', () => {
    expect(OPENLANE_SYSTEM_FRAMEWORKS).toContain(OPENLANE_BASELINE_STANDARD.framework)
    expect(OPENLANE_SYSTEM_FRAMEWORKS).toContain(OPENLANE_TRUST_CENTER_STANDARD.framework)
  })

  test('template controls are scoped to system-owned OL Baseline records', () => {
    expect(TEMPLATE_CONTROLS_WHERE).toEqual({ systemOwned: true, referenceFramework: OPENLANE_BASELINE_STANDARD.shortName })
  })
})

describe('isSystemStandardRecord', () => {
  test('is true for a system-owned record on a system framework', () => {
    expect(isSystemStandardRecord({ systemOwned: true, framework: OPENLANE_BASELINE_STANDARD.framework })).toBe(true)
    expect(isSystemStandardRecord({ systemOwned: true, framework: OPENLANE_TRUST_CENTER_STANDARD.framework })).toBe(true)
  })

  test('is false when the record is not system-owned, even on a system framework', () => {
    // An org can legitimately create its own standard naming the same framework.
    expect(isSystemStandardRecord({ systemOwned: false, framework: OPENLANE_BASELINE_STANDARD.framework })).toBe(false)
  })

  test('is false for a system-owned record on an unknown framework', () => {
    expect(isSystemStandardRecord({ systemOwned: true, framework: 'soc2' })).toBe(false)
  })

  test('is false when either field is missing or null', () => {
    expect(isSystemStandardRecord({})).toBe(false)
    expect(isSystemStandardRecord({ systemOwned: null, framework: OPENLANE_BASELINE_STANDARD.framework })).toBe(false)
    expect(isSystemStandardRecord({ systemOwned: true, framework: null })).toBe(false)
  })
})
