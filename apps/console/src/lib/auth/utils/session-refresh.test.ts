import type { Session } from 'next-auth'
import { recoverTokensAfterUnauthorized, refreshTokens, setTokenPersister } from './session-refresh'
import { resetSessionProbe } from './session-health'
import { markSessionExpired, resetSessionStatus } from './session-status'
import { clearTokens, getKnownTokens, setAuthoritativeTokens } from './session-tokens'

/**
 * Core issues refresh tokens with `nbf = accessTokenExp - 15m`, so for most of a
 * session's life /v1/refresh cannot succeed and the old reactive 401 path read
 * that predictable failure as a dead credential. recoverTokensAfterUnauthorized
 * still adopts a token another tab already obtained, but gates the network
 * refresh on the token actually being due.
 */

const HOUR_S = 60 * 60

// Unsigned JWT-shaped string; jwtDecode only base64-decodes the payload.
const makeToken = (id: string, expiresInSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000)
  const payload = { id, iat: now - (HOUR_S - expiresInSeconds), exp: now + expiresInSeconds }
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${b64({ alg: 'none' })}.${b64(payload)}.`
}

// refreshAt is exp - min(60s, ttl*5%); a 1h token is due inside its last minute.
const freshToken = (id: string) => makeToken(id, HOUR_S)
const dueToken = (id: string) => makeToken(id, 30)

// Deliberately does NOT define `window`: fetchCSRFToken only populates its
// module-level cache when one exists, and secure-fetch.test.ts asserts on that
// cache's lifecycle. Leaving window undefined keeps these files independent.
const globals = globalThis as unknown as { navigator?: unknown; fetch: typeof fetch }
const originalNavigator = globals.navigator
const originalFetch = globals.fetch

// withRefreshLock dedupes concurrent refreshes through the Web Locks API, which
// bun does not implement — without a stand-in it silently degrades to an
// unsynchronized run and the dedupe cannot be observed. Serialize by name.
const lockQueues = new Map<string, Promise<unknown>>()
const locksStub = {
  request: <T>(name: string, _options: unknown, run: () => Promise<T>): Promise<T> => {
    const previous = lockQueues.get(name) ?? Promise.resolve()
    const next = previous.then(run, run)
    lockQueues.set(
      name,
      next.catch(() => undefined),
    )
    return next
  },
}

let sessionTokens: { accessToken: string; refreshToken: string } | null = null
let calls: string[] = []
let refreshResponse: () => Response

globals.navigator = { locks: locksStub }
globals.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input)
  calls.push(url)

  if (url.includes('/api/auth/session')) {
    return new Response(JSON.stringify(sessionTokens ? { user: sessionTokens } : {}), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  // secureFetch mints a CSRF token before any authenticated POST.
  if (url.includes('/csrf')) {
    return new Response(JSON.stringify({ csrf: 'test-csrf' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  if (url.includes('/v1/refresh')) return refreshResponse()

  throw new Error(`unexpected fetch: ${url}`)
}) as typeof fetch

afterAll(() => {
  globals.navigator = originalNavigator
  globals.fetch = originalFetch
})

beforeEach(() => {
  resetSessionStatus()
  setTokenPersister(null)
  calls = []
  lockQueues.clear()
  clearTokens()
  resetSessionProbe()
  refreshResponse = () => new Response(JSON.stringify({ access_token: freshToken('refreshed'), refresh_token: 'r-refreshed' }), { status: 200, headers: { 'content-type': 'application/json' } })
})

const sessionWith = ({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }): Session => ({
  expires: new Date(Date.now() + HOUR_S * 1000).toISOString(),
  user: {
    id: 'u-1',
    accessToken,
    refreshToken,
    activeOrganizationId: 'org-1',
    image: '',
    isTfaEnabled: false,
    isOnboarding: false,
    modules: [],
  },
})

const captureConsole = async <T>(run: () => Promise<T>): Promise<{ result: T; errors: unknown[] }> => {
  const errors: unknown[] = []
  const originalError = console.error
  const originalWarn = console.warn

  console.error = (...args: unknown[]) => {
    errors.push(args[0])
  }
  console.warn = () => {}

  try {
    return { result: await run(), errors }
  } finally {
    console.error = originalError
    console.warn = originalWarn
  }
}

const refreshCalls = () => calls.filter((c) => c.includes('/v1/refresh')).length
const probeCalls = () => calls.filter((c) => c.includes('/api/auth/session')).length

describe('recoverTokensAfterUnauthorized', () => {
  test('a 401 on a token that is not due does NOT call /v1/refresh', async () => {
    const access = freshToken('a')
    const failed = setAuthoritativeTokens(access, 'r-a')
    sessionTokens = { accessToken: access, refreshToken: 'r-a' }

    const recovered = await recoverTokensAfterUnauthorized(failed)

    expect(recovered).toBeNull()
    expect(probeCalls()).toBe(1)
    expect(refreshCalls()).toBe(0)
  })

  test('adopts a newer token from the session cookie without refreshing', async () => {
    const failed = setAuthoritativeTokens(freshToken('old'), 'r-old')
    const newer = freshToken('newer')
    sessionTokens = { accessToken: newer, refreshToken: 'r-newer' }

    const recovered = await recoverTokensAfterUnauthorized(failed)

    expect(recovered?.accessToken).toBe(newer)
    expect(refreshCalls()).toBe(0)
  })

  test('adopts a newer in-memory token without probing or refreshing', async () => {
    const failed = { accessToken: freshToken('stale'), refreshToken: 'r-stale', issuedAt: 0, refreshAt: 0 }
    const newer = freshToken('installed')
    setAuthoritativeTokens(newer, 'r-installed')

    const recovered = await recoverTokensAfterUnauthorized(failed)

    expect(recovered?.accessToken).toBe(newer)
    expect(probeCalls()).toBe(0)
    expect(refreshCalls()).toBe(0)
  })

  test('a 401 on a token that IS due refreshes over the network', async () => {
    const access = dueToken('due')
    const failed = setAuthoritativeTokens(access, 'r-due')
    sessionTokens = { accessToken: access, refreshToken: 'r-due' }

    const recovered = await recoverTokensAfterUnauthorized(failed)

    expect(refreshCalls()).toBe(1)
    expect(recovered?.accessToken).not.toBe(access)
  })

  test('concurrent recoveries of a due token issue a single /v1/refresh', async () => {
    const access = dueToken('shared')
    const failed = setAuthoritativeTokens(access, 'r-shared')
    sessionTokens = { accessToken: access, refreshToken: 'r-shared' }

    const results = await Promise.all([recoverTokensAfterUnauthorized(failed), recoverTokensAfterUnauthorized(failed), recoverTokensAfterUnauthorized(failed)])

    expect(refreshCalls()).toBe(1)
    for (const result of results) expect(result?.accessToken).not.toBe(access)
  })
})

describe('refreshTokens', () => {
  test('a refresh that lands after the session ended does not commit its tokens', async () => {
    const due = dueToken('due')
    setAuthoritativeTokens(due, 'r-due')
    sessionTokens = { accessToken: due, refreshToken: 'r-due' }

    refreshResponse = () => {
      markSessionExpired()
      return new Response(JSON.stringify({ access_token: freshToken('resurrected'), refresh_token: 'r-resurrected' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    await expect(refreshTokens('r-due')).rejects.toThrow('Session expired')
    expect(getKnownTokens()).toBeNull()

    resetSessionStatus()
  })

  // Only safe while the browser is the sole producer of token pairs — every other producer
  // installs the session cookie itself. Reintroduce a server-side refresh and this adopts a
  // pair whose Set-Cookie went nowhere. refresh-token.ts imports 'client-only' to stop that.
  test('adopts a strictly newer probed pair without touching /v1/refresh', async () => {
    setAuthoritativeTokens(dueToken('known'), 'r-known')
    const newer = freshToken('probed')
    sessionTokens = { accessToken: newer, refreshToken: 'r-probed' }

    const adopted = await refreshTokens('r-known')

    expect(adopted.accessToken).toBe(newer)
    expect(adopted.refreshToken).toBe('r-probed')
    expect(refreshCalls()).toBe(0)
  })

  test('a due token with no newer probed pair refreshes over the network', async () => {
    const due = dueToken('due')
    setAuthoritativeTokens(due, 'r-due')
    sessionTokens = { accessToken: due, refreshToken: 'r-due' }

    const adopted = await refreshTokens('r-due')

    expect(refreshCalls()).toBe(1)
    expect(adopted.accessToken).not.toBe(due)
  })

  test('a persister that stores only the access token is retried and then reported as a failure', async () => {
    const due = dueToken('due')
    setAuthoritativeTokens(due, 'r-due')
    sessionTokens = { accessToken: due, refreshToken: 'r-due' }

    const persisted: Array<{ accessToken: string; refreshToken: string }> = []
    setTokenPersister(async (tokens) => {
      persisted.push(tokens)
      return sessionWith({ accessToken: tokens.accessToken, refreshToken: 'r-not-stored' })
    })

    const { result: adopted, errors } = await captureConsole(() => refreshTokens('r-due'))

    expect(adopted.accessToken).not.toBe(due)
    expect(persisted).toHaveLength(2)
    expect(errors).toContain('❌ Session update did not store the refreshed tokens after retrying')
  })

  test('a persister that lands on the second attempt is not reported as a failure', async () => {
    const due = dueToken('due')
    setAuthoritativeTokens(due, 'r-due')
    sessionTokens = { accessToken: due, refreshToken: 'r-due' }

    let attempts = 0
    setTokenPersister(async (tokens) => {
      attempts += 1
      return attempts === 1 ? sessionWith({ accessToken: tokens.accessToken, refreshToken: 'r-not-stored' }) : sessionWith(tokens)
    })

    const { result: adopted, errors } = await captureConsole(() => refreshTokens('r-due'))

    expect(attempts).toBe(2)
    expect(errors).toHaveLength(0)
    expect(adopted.accessToken).not.toBe(due)
  })

  test('a persister that throws before succeeding is not reported as a failure', async () => {
    const due = dueToken('due')
    setAuthoritativeTokens(due, 'r-due')
    sessionTokens = { accessToken: due, refreshToken: 'r-due' }

    let attempts = 0
    setTokenPersister(async (tokens) => {
      attempts += 1

      if (attempts === 1) {
        throw new Error('network blip')
      }

      return sessionWith(tokens)
    })

    const { errors } = await captureConsole(() => refreshTokens('r-due'))

    expect(attempts).toBe(2)
    expect(errors).toHaveLength(0)
  })
})
