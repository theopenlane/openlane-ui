import { ControlControlStatus } from '@repo/codegen/src/schema'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'
import { deriveOrgCoverage, getFrameworkRelatedControls, getOrgRelatedControls, hasOrgCoverageGap, hasPolicyGap, type RelatedControlItem } from './report-coverage'

/**
 * Drives the control report's org-coverage column and its gap filters. A related control counts
 * as org-owned when it has no referenceFramework or that framework is 'CUSTOM', and worstStatus
 * takes the earliest entry in ORG_COVERAGE_SEVERITY_ORDER.
 */

const related = (over: Partial<RelatedControlItem> = {}): RelatedControlItem =>
  ({
    id: over.id ?? 'rc-1',
    refCode: over.refCode ?? 'ORG-1',
    status: over.status ?? ControlControlStatus.APPROVED,
    referenceFramework: 'referenceFramework' in over ? over.referenceFramework : null,
  }) as RelatedControlItem

const control = (over: Partial<ControlReportItem> = {}): ControlReportItem =>
  ({
    id: 'c-1',
    refCode: 'CC1.1',
    referenceFramework: 'SOC2',
    relatedControls: [],
    linkedPolicies: { totalCount: 0, internalPolicies: [] },
    ...over,
  }) as unknown as ControlReportItem

describe('org vs framework partitioning', () => {
  test('treats a missing referenceFramework as org-owned', () => {
    expect(getOrgRelatedControls([related({ referenceFramework: null })])).toHaveLength(1)
    expect(getFrameworkRelatedControls([related({ referenceFramework: null })])).toHaveLength(0)
  })

  test("treats the literal 'CUSTOM' framework as org-owned", () => {
    expect(getOrgRelatedControls([related({ referenceFramework: 'CUSTOM' })])).toHaveLength(1)
  })

  test('treats a named framework as framework-owned', () => {
    expect(getOrgRelatedControls([related({ referenceFramework: 'SOC2' })])).toHaveLength(0)
    expect(getFrameworkRelatedControls([related({ referenceFramework: 'SOC2' })])).toHaveLength(1)
  })

  test('tolerates null/undefined input', () => {
    expect(getOrgRelatedControls(null)).toEqual([])
    expect(getFrameworkRelatedControls(undefined)).toEqual([])
  })
})

describe('deriveOrgCoverage', () => {
  test('returns null when there is no org-owned related control', () => {
    expect(deriveOrgCoverage([])).toBeNull()
    expect(deriveOrgCoverage([related({ referenceFramework: 'SOC2' })])).toBeNull()
  })

  test('counts approved refs and reports APPROVED as the worst when all are approved', () => {
    const coverage = deriveOrgCoverage([related({ id: 'a', status: ControlControlStatus.APPROVED }), related({ id: 'b', status: ControlControlStatus.APPROVED })])

    expect(coverage).toMatchObject({ approvedCount: 2, activeCount: 2, worstStatus: ControlControlStatus.APPROVED })
  })

  test('picks the worst status by severity order, not by input order', () => {
    const coverage = deriveOrgCoverage([
      related({ id: 'a', status: ControlControlStatus.APPROVED }),
      related({ id: 'b', status: ControlControlStatus.NOT_IMPLEMENTED }),
      related({ id: 'c', status: ControlControlStatus.CHANGES_REQUESTED }),
    ])

    expect(coverage?.worstStatus).toBe(ControlControlStatus.CHANGES_REQUESTED)
    expect(coverage?.approvedCount).toBe(1)
    expect(coverage?.activeCount).toBe(3)
  })

  test('excludes ARCHIVED and NOT_APPLICABLE from the active tally but keeps them in the ref list', () => {
    const coverage = deriveOrgCoverage([
      related({ id: 'a', status: ControlControlStatus.APPROVED }),
      related({ id: 'b', status: ControlControlStatus.ARCHIVED }),
      related({ id: 'c', status: ControlControlStatus.NOT_APPLICABLE }),
    ])

    expect(coverage?.activeCount).toBe(1)
    expect(coverage?.approvedCount).toBe(1)
    expect(coverage?.orgControlRefs).toHaveLength(3)
  })

  test('reports zero active coverage when every org ref is inactive', () => {
    const coverage = deriveOrgCoverage([related({ id: 'a', status: ControlControlStatus.ARCHIVED })])

    expect(coverage).not.toBeNull()
    expect(coverage?.activeCount).toBe(0)
    expect(coverage?.worstStatus).toBeNull()
  })
})

describe('gap predicates', () => {
  test('a custom control never counts as having a coverage or policy gap', () => {
    const custom = control({ referenceFramework: 'CUSTOM', relatedControls: [], linkedPolicies: { totalCount: 0, internalPolicies: [] } })

    expect(hasOrgCoverageGap(custom)).toBe(false)
    expect(hasPolicyGap(custom)).toBe(false)
  })

  test('a framework control with no org-owned related control has a coverage gap', () => {
    expect(hasOrgCoverageGap(control({ relatedControls: [] }))).toBe(true)
    expect(hasOrgCoverageGap(control({ relatedControls: [related({ referenceFramework: 'SOC2' })] }))).toBe(true)
  })

  test('a framework control whose only org coverage is archived still has a gap', () => {
    expect(hasOrgCoverageGap(control({ relatedControls: [related({ status: ControlControlStatus.ARCHIVED })] }))).toBe(true)
  })

  test('a framework control with active org coverage has no gap', () => {
    expect(hasOrgCoverageGap(control({ relatedControls: [related({ status: ControlControlStatus.NOT_IMPLEMENTED })] }))).toBe(false)
  })

  test('policy gap tracks the linked internal policies list', () => {
    expect(hasPolicyGap(control({ linkedPolicies: { totalCount: 0, internalPolicies: [] } }))).toBe(true)
    expect(hasPolicyGap(control({ linkedPolicies: { totalCount: 1, internalPolicies: [{ id: 'p-1' }] } } as unknown as Partial<ControlReportItem>))).toBe(false)
  })
})
