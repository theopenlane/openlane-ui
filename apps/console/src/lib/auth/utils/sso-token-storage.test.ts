import { clearSsoTokenAuthorization, readSsoTokenAuthorization, setSsoTokenAuthorization } from './sso-token-storage'

/**
 * ISS-2680 — authorizing an API token for SSO always redirected back to the
 * personal-access-tokens page, because the token TYPE was not round-tripped
 * across the SSO hop. It is now stashed in localStorage and read back on return.
 *
 * This is parsed from storage that survives a redirect, so it has to be
 * defensive: unparseable JSON, a missing or unrecognised tokenType, and a
 * throwing localStorage (private mode) all yield null rather than sending the
 * user to the wrong page or crashing the callback.
 */

const store = new Map<string, string>()

const globals = globalThis as unknown as { window?: unknown; localStorage?: unknown }
const originalWindow = globals.window
const originalLocalStorage = globals.localStorage

const workingStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
}

globals.window = globalThis
globals.localStorage = workingStorage

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

beforeEach(() => {
  store.clear()
  globals.localStorage = workingStorage
})

describe('sso token authorization round-trip', () => {
  test('reads back an api token type', () => {
    setSsoTokenAuthorization('api')

    expect(readSsoTokenAuthorization()).toBe('api')
  })

  test('reads back a personal token type', () => {
    setSsoTokenAuthorization('personal')

    expect(readSsoTokenAuthorization()).toBe('personal')
  })

  test('returns null when nothing was stored', () => {
    expect(readSsoTokenAuthorization()).toBeNull()
  })

  test('clear removes the stored authorization', () => {
    setSsoTokenAuthorization('api')
    clearSsoTokenAuthorization()

    expect(readSsoTokenAuthorization()).toBeNull()
  })
})

describe('defensive parsing', () => {
  const writeRaw = (value: string) => store.set('api_token', value)

  test('returns null for unparseable JSON', () => {
    writeRaw('{not json')

    expect(readSsoTokenAuthorization()).toBeNull()
  })

  test('returns null when tokenType is missing', () => {
    writeRaw(JSON.stringify({ somethingElse: true }))

    expect(readSsoTokenAuthorization()).toBeNull()
  })

  test('returns null for an unrecognised tokenType', () => {
    // Guards against an old stored shape sending the user to the wrong page.
    writeRaw(JSON.stringify({ tokenType: 'service' }))

    expect(readSsoTokenAuthorization()).toBeNull()
  })

  test('returns null for an empty stored value', () => {
    writeRaw('')

    expect(readSsoTokenAuthorization()).toBeNull()
  })
})

describe('when localStorage is unavailable', () => {
  beforeEach(() => {
    globals.localStorage = {
      get length(): number {
        throw new Error('SecurityError')
      },
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    }
  })

  test('read returns null instead of throwing', () => {
    expect(() => readSsoTokenAuthorization()).not.toThrow()
    expect(readSsoTokenAuthorization()).toBeNull()
  })

  test('set and clear swallow the failure', () => {
    expect(() => setSsoTokenAuthorization('api')).not.toThrow()
    expect(() => clearSsoTokenAuthorization()).not.toThrow()
  })
})
