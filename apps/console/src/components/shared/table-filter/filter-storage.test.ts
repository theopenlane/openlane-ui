import { type FilterField } from '@/types'
import { getFiltersUpdatedEvent, loadFilters, loadQuickFilter, pickDeclaredFilterKeys, saveFilters, saveQuickFilters, type TFilterState } from './filter-storage'
import { getWhereCondition, type TQuickFilter } from './table-filter-helper'

/**
 * ISS-2398 — clicking a severity chart segment used to apply BOTH a local
 * additionalWhereFilter and the persisted table filter, so the list was filtered
 * twice. The charts now route entirely through this shared filter storage and
 * re-sync from a CustomEvent, which makes the round-trip and the event name the
 * load-bearing parts.
 *
 * The event name is org-scoped: two organizations must not wake each other's
 * tables.
 */

const store = new Map<string, string>()

const globals = globalThis as unknown as { window?: unknown; localStorage?: unknown }
const originalWindow = globals.window
const originalLocalStorage = globals.localStorage

globals.window = globalThis
globals.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
}

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

beforeEach(() => store.clear())

const PAGE = 'CONTROL' as Parameters<typeof saveFilters>[0]
const ORG = 'org-123'
const OTHER_ORG = 'org-456'

const fields: FilterField[] = [
  { key: 'refCodeContainsFold', label: 'Ref Code', type: 'text' },
  { key: 'statusIn', label: 'Status', type: 'multiselect', options: [{ value: 'APPROVED', label: 'Approved' }] },
  { key: 'createdAt', label: 'Created', type: 'date' },
] as FilterField[]

describe('saveFilters / loadFilters round-trip', () => {
  test('reads back what was written', () => {
    saveFilters(PAGE, { refCodeContainsFold: 'CC1' }, ORG)

    expect(loadFilters(PAGE, undefined, ORG)).toEqual({ refCodeContainsFold: 'CC1' })
  })

  test('returns null when nothing was stored', () => {
    expect(loadFilters(PAGE, undefined, ORG)).toBeNull()
  })

  test('revives ISO date strings back into Date objects', () => {
    const created = new Date('2026-07-09T12:00:00.000Z')
    saveFilters(PAGE, { createdAt: created }, ORG)

    const loaded = loadFilters(PAGE, undefined, ORG)
    expect(loaded?.createdAt).toBeInstanceOf(Date)
    expect((loaded?.createdAt as Date).toISOString()).toBe(created.toISOString())
  })

  test('returns null for corrupt JSON rather than throwing', () => {
    saveFilters(PAGE, { refCodeContainsFold: 'CC1' }, ORG)
    // Corrupt the stored value directly.
    for (const key of store.keys()) store.set(key, '{not json')

    expect(loadFilters(PAGE, undefined, ORG)).toBeNull()
  })

  test('keeps organizations isolated', () => {
    saveFilters(PAGE, { refCodeContainsFold: 'for-123' }, ORG)
    saveFilters(PAGE, { refCodeContainsFold: 'for-456' }, OTHER_ORG)

    expect(loadFilters(PAGE, undefined, ORG)).toEqual({ refCodeContainsFold: 'for-123' })
    expect(loadFilters(PAGE, undefined, OTHER_ORG)).toEqual({ refCodeContainsFold: 'for-456' })
  })
})

describe('loadFilters validation against declared fields', () => {
  test('drops keys that are not declared filter fields', () => {
    saveFilters(PAGE, { refCodeContainsFold: 'CC1', bogusKey: 'x' }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({ refCodeContainsFold: 'CC1' })
  })

  test('drops an empty text value', () => {
    saveFilters(PAGE, { refCodeContainsFold: '   ' }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({})
  })

  test('drops multiselect values that are not declared options', () => {
    saveFilters(PAGE, { statusIn: ['APPROVED', 'NOT_A_STATUS'] }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({ statusIn: ['APPROVED'] })
  })

  test('drops a multiselect whose every value is unknown', () => {
    saveFilters(PAGE, { statusIn: ['NOT_A_STATUS'] }, ORG)

    expect(loadFilters(PAGE, fields, ORG)).toEqual({})
  })
})

describe('pickDeclaredFilterKeys', () => {
  test('keeps only declared keys', () => {
    const declared = new Set(['statusIn'])
    expect(pickDeclaredFilterKeys({ statusIn: ['APPROVED'], other: 'x' }, declared, PAGE)).toEqual({ statusIn: ['APPROVED'] })
  })

  test('returns an empty object when nothing matches', () => {
    expect(pickDeclaredFilterKeys({ other: 'x' }, new Set(['statusIn']), PAGE)).toEqual({})
  })
})

describe('getFiltersUpdatedEvent', () => {
  test('is stable for the same page and organization', () => {
    expect(getFiltersUpdatedEvent(PAGE, ORG)).toBe(getFiltersUpdatedEvent(PAGE, ORG))
  })

  test('differs across organizations so one org cannot wake another', () => {
    expect(getFiltersUpdatedEvent(PAGE, ORG)).not.toBe(getFiltersUpdatedEvent(PAGE, OTHER_ORG))
  })

  test('differs across pages', () => {
    const otherPage = 'RISK' as typeof PAGE
    expect(getFiltersUpdatedEvent(PAGE, ORG)).not.toBe(getFiltersUpdatedEvent(otherPage, ORG))
  })
})

describe('saveFilters notification', () => {
  test('dispatches the org-scoped event carrying the new state', () => {
    const received: unknown[] = []
    const handler = (event: Event) => received.push((event as CustomEvent).detail)
    const eventName = getFiltersUpdatedEvent(PAGE, ORG)

    globalThis.addEventListener(eventName, handler)
    saveFilters(PAGE, { statusIn: ['APPROVED'] }, ORG)
    globalThis.removeEventListener(eventName, handler)

    expect(received).toEqual([{ statusIn: ['APPROVED'] }])
  })

  test('does not notify a different organization', () => {
    const received: unknown[] = []
    const handler = () => received.push(true)
    const otherEvent = getFiltersUpdatedEvent(PAGE, OTHER_ORG)

    globalThis.addEventListener(otherEvent, handler)
    saveFilters(PAGE, { statusIn: ['APPROVED'] }, ORG)
    globalThis.removeEventListener(otherEvent, handler)

    expect(received).toEqual([])
  })
})

const validationFields: FilterField[] = [
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

    expect(loadFilters(PAGE, validationFields, ORG)).toEqual({})
  })

  test('drops a select value that is no longer an offered option', () => {
    saveFilters(PAGE, { status: 'RETIRED' }, ORG)

    expect(loadFilters(PAGE, validationFields, ORG)).toEqual({})
  })

  test('drops an unparseable date and a range with both ends cleared', () => {
    saveFilters(PAGE, { createdAt: 'not-a-date', updatedAt: { from: undefined, to: undefined } }, ORG)

    expect(loadFilters(PAGE, validationFields, ORG)).toEqual({})
  })

  test('keeps a false radio value rather than treating it as unset', () => {
    saveFilters(PAGE, { hasControls: false }, ORG)

    expect(loadFilters(PAGE, validationFields, ORG)).toEqual({ hasControls: false })
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

    expect(getWhereCondition(loadFilters(PAGE, validationFields, ORG) ?? {}, validationFields)).toEqual({ and: [{ refCodeContainsFold: 'CC1' }] })
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
