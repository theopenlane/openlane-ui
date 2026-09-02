import { type AuditorDashboardRelatedControl } from '@/lib/graphql-hooks/control'
import { getProgramScopedMappedControls } from './mapped-controls'

const related = (overrides: Partial<AuditorDashboardRelatedControl> & { id: string; refCode: string }): AuditorDashboardRelatedControl =>
  ({ isSubcontrol: false, referenceFramework: null, ...overrides }) as AuditorDashboardRelatedControl

const refCodes = (rows: AuditorDashboardRelatedControl[]) => rows.map((row) => row.refCode)
const ids = (rows: AuditorDashboardRelatedControl[]) => rows.map((row) => row.id)

const SOC2 = new Set(['SOC 2'])

describe('getProgramScopedMappedControls — scope', () => {
  it('returns nothing when there are no related controls', () => {
    expect(getProgramScopedMappedControls({ relatedControls: [], controlId: 'ctl_1', programFrameworks: SOC2 })).toEqual([])
    expect(getProgramScopedMappedControls({ relatedControls: null, controlId: 'ctl_1', programFrameworks: SOC2 })).toEqual([])
    expect(getProgramScopedMappedControls({ controlId: 'ctl_1', programFrameworks: SOC2 })).toEqual([])
  })

  it('never maps a control to itself', () => {
    const rows = [related({ id: 'ctl_1', refCode: 'CC1.1', referenceFramework: 'SOC 2' }), related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2'])
  })

  it('keeps a control whose framework is in the program', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2'])
  })

  it('drops a control whose framework is outside the program', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'A.5.1', referenceFramework: 'ISO 27001' })]
    expect(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 })).toEqual([])
  })

  it('always keeps a CUSTOM control, whether it is null or the literal label', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'ORG-1', referenceFramework: null }), related({ id: 'ctl_3', refCode: 'ORG-2', referenceFramework: 'CUSTOM' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2', 'ctl_3'])
  })

  it('keeps CUSTOM controls even when the program has no frameworks at all', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'ORG-1' }), related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: new Set() }))).toEqual(['ctl_2'])
  })

  it('treats an empty-string framework as CUSTOM rather than matching an empty program entry', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'ORG-1', referenceFramework: '' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2'])
  })
})

describe('getProgramScopedMappedControls — de-duplication', () => {
  it('collapses two rows sharing framework and ref code', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2' }), related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2'])
  })

  it('keeps the lowest id when collapsing duplicates, regardless of input order', () => {
    const rows = [related({ id: 'ctl_9', refCode: 'CC1.2', referenceFramework: 'SOC 2' }), related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_3'])
  })

  it('does not collapse a control and a subcontrol that share a ref code', () => {
    const rows = [
      related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2', isSubcontrol: false }),
      related({ id: 'sub_2', refCode: 'CC1.2', referenceFramework: 'SOC 2', isSubcontrol: true }),
    ]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toHaveLength(2)
  })

  it('does not collapse the same ref code across different frameworks', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2' }), related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'CUSTOM' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toHaveLength(2)
  })

  it('collapses a null framework with the literal CUSTOM label, since both display as CUSTOM', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'ORG-1', referenceFramework: null }), related({ id: 'ctl_3', refCode: 'ORG-1', referenceFramework: 'CUSTOM' })]
    expect(ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ctl_2'])
  })
})

describe('getProgramScopedMappedControls — ordering', () => {
  it('orders by framework, then ref code, then id', () => {
    const rows = [
      related({ id: 'ctl_5', refCode: 'CC2.1', referenceFramework: 'SOC 2' }),
      related({ id: 'ctl_4', refCode: 'ORG-1', referenceFramework: null }),
      related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' }),
    ]
    const result = getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 })
    expect(refCodes(result)).toEqual(['ORG-1', 'CC1.2', 'CC2.1'])
  })

  it('sorts CUSTOM before SOC 2 because it compares on the displayed label', () => {
    const rows = [related({ id: 'ctl_2', refCode: 'CC1.2', referenceFramework: 'SOC 2' }), related({ id: 'ctl_3', refCode: 'ORG-1', referenceFramework: null })]
    expect(refCodes(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))).toEqual(['ORG-1', 'CC1.2'])
  })

  it('produces the same output whatever order the backend returned', () => {
    const rows = [
      related({ id: 'ctl_5', refCode: 'CC2.1', referenceFramework: 'SOC 2' }),
      related({ id: 'ctl_4', refCode: 'ORG-1' }),
      related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' }),
    ]
    const forward = ids(getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 }))
    const reversed = ids(getProgramScopedMappedControls({ relatedControls: [...rows].reverse(), controlId: 'ctl_1', programFrameworks: SOC2 }))
    expect(forward).toEqual(reversed)
  })

  it('does not mutate the caller list', () => {
    const rows = [related({ id: 'ctl_5', refCode: 'CC2.1', referenceFramework: 'SOC 2' }), related({ id: 'ctl_3', refCode: 'CC1.2', referenceFramework: 'SOC 2' })]
    getProgramScopedMappedControls({ relatedControls: rows, controlId: 'ctl_1', programFrameworks: SOC2 })
    expect(ids(rows)).toEqual(['ctl_5', 'ctl_3'])
  })
})
