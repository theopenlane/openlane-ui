import { Filter } from 'lucide-react'
import { getActiveFilterCount, getQuickFiltersWhereCondition, getWhereCondition, handleDateEQOperator, handleDateRangeOperator, toUtcDayStart, type TQuickFilter } from './table-filter-helper'
import { type TFilterState } from './filter-storage'
import { type FilterField } from '@/types'

const field = (key: string, type: FilterField['type'], extra: Partial<FilterField> = {}): FilterField => ({ key, label: key, type, icon: Filter, ...extra })

const systemTimeZone = process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone

const withTimeZone = (timeZone: string, run: () => void) => {
  process.env.TZ = timeZone
  try {
    run()
  } finally {
    process.env.TZ = systemTimeZone
  }
}

describe('toUtcDayStart', () => {
  test('emits the instant of local midnight, not local midnight stamped as UTC', () => {
    withTimeZone('Europe/Zagreb', () => {
      expect(toUtcDayStart(new Date(2026, 7, 29, 15, 30))).toBe('2026-08-28T22:00:00.000Z')
    })
    withTimeZone('America/Los_Angeles', () => {
      expect(toUtcDayStart(new Date(2026, 7, 29, 15, 30))).toBe('2026-08-29T07:00:00.000Z')
    })
    withTimeZone('UTC', () => {
      expect(toUtcDayStart(new Date(2026, 7, 29, 15, 30))).toBe('2026-08-29T00:00:00.000Z')
    })
  })

  test('tracks the offset change across a DST transition', () => {
    withTimeZone('Europe/Zagreb', () => {
      expect(toUtcDayStart(new Date(2026, 9, 25, 12, 0))).toBe('2026-10-24T22:00:00.000Z')
      expect(toUtcDayStart(new Date(2026, 9, 26, 12, 0))).toBe('2026-10-25T23:00:00.000Z')
      expect(toUtcDayStart(new Date(2026, 0, 15, 12, 0))).toBe('2026-01-14T23:00:00.000Z')
    })
  })

  test('round trips back to local midnight in every zone', () => {
    for (const timeZone of ['UTC', 'Europe/Zagreb', 'America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Chatham']) {
      withTimeZone(timeZone, () => {
        const local = new Date(toUtcDayStart(new Date(2026, 7, 29, 15, 30)))
        expect([local.getHours(), local.getMinutes(), local.getSeconds(), local.getMilliseconds()]).toEqual([0, 0, 0, 0])
      })
    }
  })
})

describe('handleDateEQOperator', () => {
  test('brackets the selected day as a half open interval', () => {
    withTimeZone('Europe/Zagreb', () => {
      expect(handleDateEQOperator(new Date(2026, 7, 29, 15, 30), 'createdAt')).toEqual([{ createdAtGTE: '2026-08-28T22:00:00.000Z', createdAtLT: '2026-08-29T22:00:00.000Z' }])
    })
  })

  test('accepts an ISO string', () => {
    withTimeZone('UTC', () => {
      expect(handleDateEQOperator('2026-08-29T15:30:00.000Z', 'createdAt')).toEqual([{ createdAtGTE: '2026-08-29T00:00:00.000Z', createdAtLT: '2026-08-30T00:00:00.000Z' }])
    })
  })

  test('returns no conditions for an unparseable date', () => {
    expect(handleDateEQOperator('not-a-date', 'createdAt')).toEqual([])
    expect(handleDateEQOperator(new Date(Number.NaN), 'createdAt')).toEqual([])
  })
})

describe('handleDateRangeOperator', () => {
  test('returns nothing when neither end is set', () => {
    expect(handleDateRangeOperator({ from: undefined, to: undefined }, 'createdAt')).toEqual([])
  })

  test('emits only a lower bound when the range is open ended', () => {
    withTimeZone('UTC', () => {
      expect(handleDateRangeOperator({ from: new Date(2026, 7, 29), to: undefined }, 'createdAt')).toEqual([{ createdAtGTE: '2026-08-29T00:00:00.000Z' }])
    })
  })

  test('emits only an exclusive upper bound of the day after `to`', () => {
    withTimeZone('UTC', () => {
      expect(handleDateRangeOperator({ from: undefined, to: new Date(2026, 7, 29) }, 'createdAt')).toEqual([{ createdAtLT: '2026-08-30T00:00:00.000Z' }])
    })
  })

  test('includes the whole of the final day', () => {
    withTimeZone('UTC', () => {
      expect(handleDateRangeOperator({ from: new Date(2026, 7, 29), to: new Date(2026, 8, 2) }, 'createdAt')).toEqual([
        { createdAtGTE: '2026-08-29T00:00:00.000Z', createdAtLT: '2026-09-03T00:00:00.000Z' },
      ])
    })
  })

  test('normalises a reversed range', () => {
    withTimeZone('UTC', () => {
      const reversed = handleDateRangeOperator({ from: new Date(2026, 8, 2), to: new Date(2026, 7, 29) }, 'createdAt')
      expect(reversed).toEqual([{ createdAtGTE: '2026-08-29T00:00:00.000Z', createdAtLT: '2026-09-03T00:00:00.000Z' }])
    })
  })

  test('spans a single day when both ends fall on it', () => {
    withTimeZone('Europe/Zagreb', () => {
      expect(handleDateRangeOperator({ from: new Date(2026, 7, 29, 1), to: new Date(2026, 7, 29, 23) }, 'createdAt')).toEqual([
        { createdAtGTE: '2026-08-28T22:00:00.000Z', createdAtLT: '2026-08-29T22:00:00.000Z' },
      ])
    })
  })
})

describe('getWhereCondition', () => {
  const run = (fields: FilterField[], state: TFilterState) => getWhereCondition(state, fields)

  test('returns an empty object when nothing is set', () => {
    expect(run([field('displayNameContainsFold', 'text')], {})).toEqual({})
  })

  test('wraps every produced condition in a single `and`', () => {
    expect(run([field('displayNameContainsFold', 'text'), field('statusIn', 'multiselect')], { displayNameContainsFold: 'acme', statusIn: ['ACTIVE'] })).toEqual({
      and: [{ displayNameContainsFold: 'acme' }, { statusIn: ['ACTIVE'] }],
    })
  })

  test('skips empty, blank and absent values', () => {
    const fields = [field('displayNameContainsFold', 'text'), field('statusIn', 'multiselect'), field('ownerID', 'dropdownSearchSingleSelect'), field('tagsIn', 'dropdownSearchMultiselect')]
    expect(run(fields, { displayNameContainsFold: '   ', statusIn: [], ownerID: '', tagsIn: [] })).toEqual({})
  })

  test('preserves a `false` boolean rather than treating it as unset', () => {
    expect(run([field('hasControls', 'boolean')], { hasControls: false })).toEqual({ and: [{ hasControls: false }] })
    expect(run([field('hasControls', 'radio')], { hasControls: false })).toEqual({ and: [{ hasControls: false }] })
  })

  test('maps text and select to a bare equality key', () => {
    expect(run([field('displayNameContainsFold', 'text'), field('status', 'select')], { displayNameContainsFold: 'acme', status: 'ACTIVE' })).toEqual({
      and: [{ displayNameContainsFold: 'acme' }, { status: 'ACTIVE' }],
    })
  })

  test('wraps a scalar multiselect value into an array', () => {
    expect(run([field('statusIn', 'multiselect')], { statusIn: 'ACTIVE' })).toEqual({ and: [{ statusIn: ['ACTIVE'] }] })
  })

  test('turns a multiselect key ending in `With` into an id predicate', () => {
    expect(run([field('hasProgramsWith', 'multiselect')], { hasProgramsWith: ['a', 'b'] })).toEqual({ and: [{ hasProgramsWith: [{ idIn: ['a', 'b'] }] }] })
  })

  test('maps dropdownUserSearch to a nested userID predicate', () => {
    expect(run([field('hasAssigneeWith', 'dropdownUserSearch')], { hasAssigneeWith: 'user_1' })).toEqual({ and: [{ hasAssigneeWith: [{ userID: 'user_1' }] }] })
  })

  test('maps sliderNumber to a bare key and sliderRange to GTE/LTE', () => {
    expect(run([field('score', 'sliderNumber'), field('severity', 'sliderRange')], { score: 5, severity: { min: 1, max: 9 } })).toEqual({
      and: [{ score: 5 }, { severityGTE: 1 }, { severityLTE: 9 }],
    })
  })

  test('emits only the bound that is present on a sliderRange', () => {
    expect(run([field('severity', 'sliderRange')], { severity: { min: 1 } as { min: number; max: number } })).toEqual({ and: [{ severityGTE: 1 }] })
  })

  test('maps date and dateRange through the day boundary helpers', () => {
    withTimeZone('UTC', () => {
      expect(run([field('createdAt', 'date')], { createdAt: new Date(2026, 7, 29) })).toEqual({
        and: [{ createdAtGTE: '2026-08-29T00:00:00.000Z', createdAtLT: '2026-08-30T00:00:00.000Z' }],
      })
      expect(run([field('createdAt', 'dateRange')], { createdAt: { from: new Date(2026, 7, 29), to: new Date(2026, 7, 31) } })).toEqual({
        and: [{ createdAtGTE: '2026-08-29T00:00:00.000Z', createdAtLT: '2026-09-01T00:00:00.000Z' }],
      })
    })
  })

  test('ignores a dateRange with both ends cleared', () => {
    expect(run([field('createdAt', 'dateRange')], { createdAt: { from: undefined, to: undefined } })).toEqual({})
  })

  test('expands a null filter value against the declared nullableKey', () => {
    const fields = [field('ownerIDIn', 'multiselect', { nullableKey: 'ownerID' })]
    expect(run(fields, { ownerIDIn: { nullState: 'IsNil' } })).toEqual({ and: [{ ownerIDIsNil: true }] })
    expect(run(fields, { ownerIDIn: { nullState: 'NotNil' } })).toEqual({ and: [{ ownerIDNotNil: true }] })
  })

  test('drops a null filter value when the field declares no nullableKey', () => {
    expect(run([field('ownerIDIn', 'multiselect')], { ownerIDIn: { nullState: 'IsNil' } })).toEqual({})
  })

  test('ignores state entries with no matching filter field', () => {
    expect(run([field('displayNameContainsFold', 'text')], { somethingUndeclared: 'x' })).toEqual({})
  })
})

describe('getQuickFiltersWhereCondition', () => {
  const quick = (overrides: Partial<TQuickFilter>): TQuickFilter => ({ label: 'Q', key: 'q', isActive: true, type: 'custom', ...overrides })

  test('emits a boolean quick filter as a true predicate on its own key', () => {
    expect(getQuickFiltersWhereCondition(quick({ key: 'systemOwned', type: 'boolean' }))).toEqual({ and: [{ systemOwned: true }] })
  })

  test('emits the condition returned by a custom quick filter', () => {
    expect(getQuickFiltersWhereCondition(quick({ key: 'overdue', getCondition: () => ({ dueLT: '2026-08-29T00:00:00.000Z' }) }))).toEqual({ and: [{ dueLT: '2026-08-29T00:00:00.000Z' }] })
  })

  test('falls back to a true predicate when a custom quick filter has no condition', () => {
    expect(getQuickFiltersWhereCondition(quick({ key: 'mine' }))).toEqual({ and: [true] })
  })
})

describe('getActiveFilterCount', () => {
  const quick = (key: string, isActive: boolean): TQuickFilter => ({ label: key, key, isActive, type: 'custom' })

  test('counts set values and ignores empty ones', () => {
    expect(getActiveFilterCount({ a: 'x', b: '', c: undefined, d: [], e: ['1', '2'], f: false }, [])).toBe(3)
  })

  test('counts each active quick filter once and does not double count its key', () => {
    expect(getActiveFilterCount({ overdue: true, name: 'x' }, [quick('overdue', true), quick('mine', false)])).toBe(2)
  })
})
