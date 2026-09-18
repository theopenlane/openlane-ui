import { clearSsoIntent, readSsoIntent, startSsoRedirect } from './sso-intent'

const store = new Map<string, string>()
const visited: string[] = []

const globals = globalThis as unknown as { window?: unknown; localStorage?: unknown }
const originalWindow = globals.window
const originalLocalStorage = globals.localStorage

const workingStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
}

globals.window = { location: { assign: (url: string) => visited.push(url) } }
globals.localStorage = workingStorage

afterAll(() => {
  globals.window = originalWindow
  globals.localStorage = originalLocalStorage
})

beforeEach(() => {
  store.clear()
  visited.length = 0
  globals.localStorage = workingStorage
})

describe('sso intent round-trip', () => {
  test('reads back a connection test', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'test')

    expect(readSsoIntent()).toBe('test')
  })

  test('reads back an api token type', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'api')

    expect(readSsoIntent()).toBe('api')
  })

  test('reads back a personal token type', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'personal')

    expect(readSsoIntent()).toBe('personal')
  })

  test('returns null when nothing was stored', () => {
    expect(readSsoIntent()).toBeNull()
  })

  test('clear removes the stored intent', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'test')
    clearSsoIntent()

    expect(readSsoIntent()).toBeNull()
  })
})

describe('leaving for the identity provider', () => {
  test('navigates to the provider', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'test')

    expect(visited).toEqual(['https://idp.example.com/authorize'])
  })

  test('a flow that declares no intent clears an abandoned one', () => {
    startSsoRedirect('https://idp.example.com/authorize', 'test')
    startSsoRedirect('https://idp.example.com/authorize')

    expect(readSsoIntent()).toBeNull()
  })

  test('reports the failure and stays put when the intent cannot be stored', () => {
    globals.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('SecurityError')
      },
      removeItem: () => {},
    }

    expect(startSsoRedirect('https://idp.example.com/authorize', 'test')).toBe(false)
    expect(visited).toEqual([])
  })
})

describe('defensive parsing', () => {
  const writeRaw = (value: string) => store.set('sso_intent', value)

  test('returns null for an unrecognised intent', () => {
    writeRaw('service')

    expect(readSsoIntent()).toBeNull()
  })

  test('returns null for a stale JSON shape from an earlier release', () => {
    writeRaw(JSON.stringify({ tokenType: 'api' }))

    expect(readSsoIntent()).toBeNull()
  })

  test('returns null for an empty stored value', () => {
    writeRaw('')

    expect(readSsoIntent()).toBeNull()
  })

  test('returns null once the intent has expired', () => {
    writeRaw(`test:${Date.now() - 11 * 60 * 1000}`)

    expect(readSsoIntent()).toBeNull()
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
    expect(() => readSsoIntent()).not.toThrow()
    expect(readSsoIntent()).toBeNull()
  })

  test('clear swallows the failure', () => {
    expect(() => clearSsoIntent()).not.toThrow()
  })
})
