import { type FilterField } from '@/types'
import { loadFilters, loadQuickFilter, pickDeclaredFilterKeys, saveFilters, saveQuickFilters, type TFilterState } from './filter-storage'
import { getWhereCondition, type TQuickFilter } from './table-filter-helper'

const store = new Map<string, string>()

const globals = globalThis as { window?: unknown; localStorage?: unknown }
const originalWindow = globals.window
const originalLocalStorage = globals.localStorage

beforeEach(() => {
  store.clear()
  globals.window = globalThis
  globals.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
  }
})

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

const PAGE = 'CONTROL' as Parameters<typeof saveFilters>[0]
const ORG = 'org-123'
const OTHER_ORG = 'org-456'

const fields: FilterField[] = [
  { key: 'refCodeContainsFold', label: 'Ref Code', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: [{ value: 'APPROVED', label: 'Approved' }] },
  { key: 'statusIn', label: 'Status', type: 'multiselect', options: [{ value: 'APPROVED', label: 'Approved' }] },
  { key: 'hasControls', label: 'Linked Controls', type: 'radio' },
  { key: 'score', label: 'Score', type: 'sliderNumber' },
  { key: 'severity', label: 'Severity', type: 'sliderRange' },
  { key: 'createdAt', label: 'Created', type: 'date' },
  { key: 'updatedAt', label: 'Updated', type: 'dateRange' },
  { key: 'ownerID', label: 'Owner', type: 'dropdownUserSearch' },
  { key: 'tagsIn', label: 'Tags', type: 'dropdownSearchMultiselect' },
] as FilterField[]

describe('loadFilters drops values that no longer match their field type', () => {
  test('drops a value whose type changed under a still declared key', () => {
    saveFilters(PAGE, { refCodeContainsFold: 42, hasControls: 'yes', score: '5', statusIn: 'APPROVED', severity: { min: 1 } } as TFilterState, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({})
  })

  test('drops a select value that is no longer an offered option', () => {
    saveFilters(PAGE, { status: 'RETIRED' }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({})
  })

  test('drops an unparseable date and a range with both ends cleared', () => {
    saveFilters(PAGE, { createdAt: 'not-a-date', updatedAt: { from: undefined, to: undefined } }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({})
  })

  test('keeps a false radio value rather than treating it as unset', () => {
    saveFilters(PAGE, { hasControls: false }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({ hasControls: false })
  })

  test('keeps a not-set state only when the field declares a nullableKey', () => {
    const nullable = [
      { key: 'ownerIDIn', label: 'Owner', type: 'multiselect', nullableKey: 'ownerID' },
      { key: 'teamIDIn', label: 'Team', type: 'multiselect' },
    ] as FilterField[]
    saveFilters(PAGE, { ownerIDIn: { nullState: 'IsNil' }, teamIDIn: { nullState: 'IsNil' } }, ORG)

    expect(loadFilters(PAGE, nullable, ORG)).toEqual({ ownerIDIn: { nullState: 'IsNil' } })
  })

  test('a corrupted stored state cannot reach the query as an unknown key', () => {
    saveFilters(PAGE, { refCodeContainsFold: 'CC1', legacyPolicyType: ['A'], statusIn: 42 } as TFilterState, ORG)

    expect(getWhereCondition(loadFilters(PAGE, fields, ORG) ?? {}, fields)).toEqual({ and: [{ refCodeContainsFold: 'CC1' }] })
  })
})

describe('pickDeclaredFilterKeys is name-only', () => {
  test('lets a mistyped value through, so it must not be the only guard', () => {
    expect(pickDeclaredFilterKeys({ statusIn: 42 } as TFilterState, new Set(['statusIn']), PAGE)).toEqual({ statusIn: 42 } as TFilterState)
  })
})

describe('loadQuickFilter', () => {
  const quickFilters: TQuickFilter[] = [
    { label: 'Overdue', key: 'overdue', type: 'custom', isActive: false, getCondition: () => ({ dueLT: '2026-08-29T00:00:00.000Z' }) },
    { label: 'System owned', key: 'systemOwned', type: 'boolean', isActive: false },
  ]

  test('returns null when nothing is stored', () => {
    expect(loadQuickFilter(PAGE, quickFilters, ORG)).toBeNull()
  })

  test('persists and restores a custom quick filter by key', () => {
    saveQuickFilters(PAGE, quickFilters[0], ORG)

    const restored = loadQuickFilter(PAGE, quickFilters, ORG)
    expect(restored?.key).toBe('overdue')
    expect(restored?.isActive).toBe(true)
    expect(restored?.getCondition?.()).toEqual({ dueLT: '2026-08-29T00:00:00.000Z' })
  })

  test('recomputes the condition from the live filter rather than the stored snapshot', () => {
    saveQuickFilters(PAGE, { ...quickFilters[0], getCondition: () => ({ dueLT: '2020-01-01T00:00:00.000Z' }) }, ORG)

    expect(loadQuickFilter(PAGE, quickFilters, ORG)?.getCondition?.()).toEqual({ dueLT: '2026-08-29T00:00:00.000Z' })
  })

  test('persists and restores a boolean quick filter', () => {
    saveQuickFilters(PAGE, quickFilters[1], ORG)

    expect(loadQuickFilter(PAGE, quickFilters, ORG)?.key).toBe('systemOwned')
  })

  test('returns null for a stored quick filter that no longer exists', () => {
    saveQuickFilters(PAGE, { label: 'Gone', key: 'removedFilter', type: 'custom', isActive: false, getCondition: () => ({}) }, ORG)
    expect(loadQuickFilter(PAGE, quickFilters, ORG)).toBeNull()

    saveQuickFilters(PAGE, { label: 'Gone', key: 'removedFilter', type: 'boolean', isActive: false }, ORG)
    expect(loadQuickFilter(PAGE, quickFilters, ORG)).toBeNull()
  })

  test('returns null for corrupt storage rather than throwing', () => {
    saveQuickFilters(PAGE, quickFilters[0], ORG)
    for (const key of store.keys()) store.set(key, '{not json')

    expect(loadQuickFilter(PAGE, quickFilters, ORG)).toBeNull()
  })

  test('a filter marked active by default wins over storage', () => {
    saveQuickFilters(PAGE, quickFilters[0], ORG)

    expect(loadQuickFilter(PAGE, [quickFilters[0], { ...quickFilters[1], isActive: true }], ORG)?.key).toBe('systemOwned')
  })

  test('keeps organizations isolated', () => {
    saveQuickFilters(PAGE, quickFilters[0], ORG)

    expect(loadQuickFilter(PAGE, quickFilters, OTHER_ORG)).toBeNull()
  })
})
