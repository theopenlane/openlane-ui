import { createOrgPersistedStore, parseString, parseStringUnion } from './org-persisted-store'

/**
 * ISS-2614 — backs a useSyncExternalStore with org-scoped localStorage. Snapshots are cached per
 * org so one org's choice cannot leak into another, and getSnapshot must be referentially stable
 * or the store re-renders forever.
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

type GroupBy = 'type' | 'kind'
const isGroupBy = (value: string): value is GroupBy => value === 'type' || value === 'kind'
const makeStore = () =>
  createOrgPersistedStore<GroupBy>(
    'group-by:work-items',
    (raw) => parseStringUnion(raw, isGroupBy),
    () => 'type',
  )

const ORG = 'org-123'
const OTHER_ORG = 'org-456'

describe('createOrgPersistedStore', () => {
  test('falls back to the default when nothing is stored', () => {
    expect(makeStore().getSnapshot(ORG)).toEqual({ value: 'type', isHydrated: true })
  })

  test('reads back a value written through set', () => {
    const s = makeStore()
    s.set(ORG, 'kind')

    expect(s.getSnapshot(ORG).value).toBe('kind')
  })

  test('persists across store instances (i.e. across a reload)', () => {
    makeStore().set(ORG, 'kind')

    expect(makeStore().getSnapshot(ORG).value).toBe('kind')
  })

  test('keeps organizations isolated', () => {
    const s = makeStore()
    s.set(ORG, 'kind')

    expect(s.getSnapshot(ORG).value).toBe('kind')
    expect(s.getSnapshot(OTHER_ORG).value).toBe('type')
  })

  test('returns a referentially stable snapshot for repeat reads', () => {
    // useSyncExternalStore re-renders forever if getSnapshot returns a new object.
    const s = makeStore()

    expect(s.getSnapshot(ORG)).toBe(s.getSnapshot(ORG))
  })

  test('returns a new snapshot object after a set', () => {
    const s = makeStore()
    const before = s.getSnapshot(ORG)
    s.set(ORG, 'kind')

    expect(s.getSnapshot(ORG)).not.toBe(before)
  })

  test('notifies subscribers on change and stops after unsubscribe', () => {
    const s = makeStore()
    let calls = 0
    const unsubscribe = s.subscribe(() => {
      calls++
    })

    s.set(ORG, 'kind')
    expect(calls).toBe(1)

    unsubscribe()
    s.set(ORG, 'type')
    expect(calls).toBe(1)
  })

  test('does not notify when the value is unchanged', () => {
    const s = makeStore()
    let calls = 0
    s.subscribe(() => {
      calls++
    })

    s.set(ORG, 'kind')
    s.set(ORG, 'kind')

    expect(calls).toBe(1)
  })

  test('falls back to the default for a corrupt or unknown stored value', () => {
    const s = makeStore()
    s.set(ORG, 'kind')
    for (const key of store.keys()) store.set(key, '"not-a-group-by"')

    expect(makeStore().getSnapshot(ORG).value).toBe('type')
  })

  test('reports the server snapshot as not hydrated', () => {
    expect(makeStore().getServerSnapshot()).toEqual({ value: 'type', isHydrated: false })
  })
})

describe('parseString', () => {
  test('accepts a non-empty JSON string', () => {
    expect(parseString('"kind"')).toBe('kind')
  })

  test('rejects an empty string, a non-string, and invalid JSON', () => {
    expect(parseString('""')).toBeNull()
    expect(parseString('42')).toBeNull()
    expect(parseString('{')).toBeNull()
  })
})

describe('parseStringUnion', () => {
  test('accepts a value the guard allows', () => {
    expect(parseStringUnion('"kind"', isGroupBy)).toBe('kind')
  })

  test('rejects a value outside the union', () => {
    expect(parseStringUnion('"other"', isGroupBy)).toBeNull()
  })
})
