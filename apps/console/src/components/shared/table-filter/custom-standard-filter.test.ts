import { AUDITOR_DASHBOARD_DEFAULT_FILTER_VALUES } from '@/components/pages/protected/auditor-dashboard/table/table-config'
import { CUSTOM_STANDARD_FILTER_OPTION, CUSTOM_STANDARD_FILTER_VALUE, buildCustomStandardFilterWhere, isCustomStandardFilter } from './custom-standard-filter'

describe('CUSTOM pseudo-option', () => {
  it('uses the literal CUSTOM string as both value and label', () => {
    expect(CUSTOM_STANDARD_FILTER_VALUE).toBe('CUSTOM')
    expect(CUSTOM_STANDARD_FILTER_OPTION).toEqual({ value: 'CUSTOM', label: 'CUSTOM' })
  })
})

describe('isCustomStandardFilter', () => {
  it('recognises a standard filter that includes CUSTOM', () => {
    expect(isCustomStandardFilter('standardIDIn', ['CUSTOM'])).toBe(true)
    expect(isCustomStandardFilter('standardIDIn', ['std_1', 'CUSTOM'])).toBe(true)
  })

  it('ignores a standard filter with only real standard ids', () => {
    expect(isCustomStandardFilter('standardIDIn', ['std_1'])).toBe(false)
  })

  it('ignores another filter key even when it carries the CUSTOM value', () => {
    expect(isCustomStandardFilter('referenceFrameworkIn', ['CUSTOM'])).toBe(false)
  })

  it('ignores values that are not arrays of strings', () => {
    expect(isCustomStandardFilter('standardIDIn', 'CUSTOM')).toBe(false)
    expect(isCustomStandardFilter('standardIDIn', [1, 2])).toBe(false)
    expect(isCustomStandardFilter('standardIDIn', null)).toBe(false)
    expect(isCustomStandardFilter('standardIDIn', undefined)).toBe(false)
    expect(isCustomStandardFilter('standardIDIn', [])).toBe(false)
  })
})

describe('buildCustomStandardFilterWhere', () => {
  it('filters on a null reference framework when only CUSTOM is selected', () => {
    expect(buildCustomStandardFilterWhere(['CUSTOM'])).toEqual({ referenceFrameworkIsNil: true })
  })

  it('filters on a null reference framework when the selection is empty', () => {
    expect(buildCustomStandardFilterWhere([])).toEqual({ referenceFrameworkIsNil: true })
  })

  it('ors the real standards with the custom bucket when both are selected', () => {
    expect(buildCustomStandardFilterWhere(['std_1', 'CUSTOM'])).toEqual({ or: [{ standardIDIn: ['std_1'] }, { referenceFrameworkIsNil: true }] })
  })

  it('keeps every real standard id and strips only the pseudo-value', () => {
    expect(buildCustomStandardFilterWhere(['std_1', 'CUSTOM', 'std_2'])).toEqual({ or: [{ standardIDIn: ['std_1', 'std_2'] }, { referenceFrameworkIsNil: true }] })
  })

  it('never emits the pseudo-value as a standard id, which the backend would not match', () => {
    expect(JSON.stringify(buildCustomStandardFilterWhere(['std_1', 'CUSTOM']))).not.toContain('"CUSTOM"')
  })
})

describe('auditor dashboard default filter', () => {
  it('defaults the framework filter to CUSTOM controls', () => {
    expect(AUDITOR_DASHBOARD_DEFAULT_FILTER_VALUES).toEqual({ standardIDIn: [CUSTOM_STANDARD_FILTER_VALUE] })
  })

  it('produces a custom-only where clause from that default', () => {
    const values = AUDITOR_DASHBOARD_DEFAULT_FILTER_VALUES.standardIDIn as string[]
    expect(isCustomStandardFilter('standardIDIn', values)).toBe(true)
    expect(buildCustomStandardFilterWhere(values)).toEqual({ referenceFrameworkIsNil: true })
  })
})
