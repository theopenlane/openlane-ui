import { ObjectTypes } from '@repo/codegen/src/type-names'
import { getOrganizationStorageKey } from '@/lib/storage/organization-storage'

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

const { SEARCH_TERM_TTL_MS, STORAGE_SEARCH_KEY_PREFIX, getInitialSearchTerm } = await import('./useStorageSearch')

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

beforeEach(() => store.clear())

const ORG = 'org_1'
const KEY = ObjectTypes.CONTROL

const scopedKey = (organizationId?: string) => getOrganizationStorageKey(`${STORAGE_SEARCH_KEY_PREFIX}${KEY.toLowerCase()}`, organizationId)

const write = (value: unknown, organizationId: string | undefined = ORG) => store.set(scopedKey(organizationId), JSON.stringify(value))

describe('getInitialSearchTerm — freshness', () => {
  it('returns a term saved just now', () => {
    write({ value: 'iso27001', savedAt: Date.now() })
    expect(getInitialSearchTerm(KEY, ORG)).toBe('iso27001')
  })

  it('returns a term saved just inside the TTL', () => {
    write({ value: 'iso27001', savedAt: Date.now() - (SEARCH_TERM_TTL_MS - 60_000) })
    expect(getInitialSearchTerm(KEY, ORG)).toBe('iso27001')
  })

  it('drops a term that has reached the TTL exactly', () => {
    write({ value: 'iso27001', savedAt: Date.now() - SEARCH_TERM_TTL_MS })
    expect(getInitialSearchTerm(KEY, ORG)).toBe('')
  })

  it('drops a term saved before the TTL window', () => {
    write({ value: 'iso27001', savedAt: Date.now() - SEARCH_TERM_TTL_MS * 2 })
    expect(getInitialSearchTerm(KEY, ORG)).toBe('')
  })

  it('drops a term stamped in the future, which cannot be trusted to expire', () => {
    write({ value: 'iso27001', savedAt: Date.now() + 60_000 })
    expect(getInitialSearchTerm(KEY, ORG)).toBe('')
  })

  it('keeps the TTL at eight hours', () => {
    expect(SEARCH_TERM_TTL_MS).toBe(8 * 60 * 60 * 1000)
  })
})

describe('getInitialSearchTerm — fallback', () => {
  it('returns the fallback when nothing is stored', () => {
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('returns the fallback when the stored term has expired', () => {
    write({ value: 'iso27001', savedAt: Date.now() - SEARCH_TERM_TTL_MS })
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('defaults the fallback to an empty string', () => {
    expect(getInitialSearchTerm(KEY, ORG)).toBe('')
  })
})

describe('getInitialSearchTerm — malformed and legacy values', () => {
  it('ignores a value that is not JSON, such as a pre-TTL bare string', () => {
    store.set(scopedKey(ORG), 'iso27001')
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('ignores a JSON value that is not the stored shape', () => {
    write({ value: 'iso27001' })
    write({ savedAt: Date.now() })
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('ignores a non-string value or non-numeric timestamp', () => {
    write({ value: 42, savedAt: Date.now() })
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
    write({ value: 'iso27001', savedAt: 'yesterday' })
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('ignores a non-finite timestamp', () => {
    store.set(scopedKey(ORG), '{"value":"iso27001","savedAt":null}')
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('ignores a JSON null', () => {
    store.set(scopedKey(ORG), 'null')
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('default')
  })

  it('preserves an empty stored term rather than falling back', () => {
    write({ value: '', savedAt: Date.now() })
    expect(getInitialSearchTerm(KEY, ORG, 'default')).toBe('')
  })
})

describe('getInitialSearchTerm — organization scoping', () => {
  it('does not read another organization stored term', () => {
    write({ value: 'iso27001', savedAt: Date.now() }, 'org_other')
    expect(getInitialSearchTerm(KEY, ORG)).toBe('')
  })

  it('keeps each organization term separate', () => {
    write({ value: 'for-one', savedAt: Date.now() }, 'org_1')
    write({ value: 'for-two', savedAt: Date.now() }, 'org_2')
    expect(getInitialSearchTerm(KEY, 'org_1')).toBe('for-one')
    expect(getInitialSearchTerm(KEY, 'org_2')).toBe('for-two')
  })

  it('does not leak one object type term into another', () => {
    write({ value: 'iso27001', savedAt: Date.now() })
    expect(getInitialSearchTerm(ObjectTypes.RISK, ORG)).toBe('')
  })
})
