import { type FilterField } from '@/types'
import { getFiltersUpdatedEvent, loadFilters, pickDeclaredFilterKeys, saveFilters } from './filter-storage'

/**
 * ISS-2398 — chart segments now route through this shared storage instead of also applying a
 * local additionalWhereFilter, which filtered the list twice. The re-sync event name is
 * org-scoped so two organizations cannot wake each other's tables.
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
