import { getOrganizationStorageItem, getOrganizationStorageKey, removeOrganizationStorageItem, setOrganizationStorageItem } from './organization-storage'

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

const ORG_ID = 'org-123'
const OTHER_ORG_ID = 'org-456'
const KEY = 'filters:controls'
const scopedKey = getOrganizationStorageKey(KEY, ORG_ID)

describe('organization storage legacy fallback', () => {
  beforeEach(() => {
    store.clear()
  })

  it('builds the scoped key from the legacy key and organization id', () => {
    expect(scopedKey).toBe(`${KEY}:organization:${ORG_ID}`)
    expect(getOrganizationStorageKey(KEY)).toBe(`${KEY}:organization:unresolved`)
  })

  it('returns the scoped value when present, ignoring the legacy value', () => {
    store.set(scopedKey, 'scoped')
    store.set(KEY, 'legacy')
    expect(getOrganizationStorageItem(KEY, ORG_ID)).toBe('scoped')
  })

  it('falls back to the legacy value without writing, so reads stay render-safe and other orgs keep the fallback', () => {
    store.set(KEY, 'legacy')
    expect(getOrganizationStorageItem(KEY, ORG_ID)).toBe('legacy')
    expect(store.has(scopedKey)).toBe(false)
    expect(store.get(KEY)).toBe('legacy')
    expect(getOrganizationStorageItem(KEY, OTHER_ORG_ID)).toBe('legacy')
  })

  it('falls back to the legacy value while the organization is unresolved', () => {
    store.set(KEY, 'legacy')
    expect(getOrganizationStorageItem(KEY)).toBe('legacy')
  })

  it('returns null when neither key exists', () => {
    expect(getOrganizationStorageItem(KEY, ORG_ID)).toBeNull()
  })

  it('set writes the scoped key and retires the legacy key', () => {
    store.set(KEY, 'legacy')
    setOrganizationStorageItem(KEY, 'next', ORG_ID)
    expect(store.get(scopedKey)).toBe('next')
    expect(store.has(KEY)).toBe(false)
  })

  it('remove clears both the scoped and legacy keys so cleared values cannot resurrect', () => {
    store.set(scopedKey, 'scoped')
    store.set(KEY, 'legacy')
    removeOrganizationStorageItem(KEY, ORG_ID)
    expect(store.has(scopedKey)).toBe(false)
    expect(store.has(KEY)).toBe(false)
  })

  it('set and remove retire the legacy key even while the organization is unresolved', () => {
    store.set(KEY, 'legacy')
    setOrganizationStorageItem(KEY, 'next')
    expect(store.has(KEY)).toBe(false)
    expect(store.get(getOrganizationStorageKey(KEY))).toBe('next')

    store.set(KEY, 'legacy-again')
    removeOrganizationStorageItem(KEY)
    expect(store.has(KEY)).toBe(false)
    expect(store.has(getOrganizationStorageKey(KEY))).toBe(false)
  })
})
