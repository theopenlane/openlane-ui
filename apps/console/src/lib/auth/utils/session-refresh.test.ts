import { recoverTokensAfterUnauthorized } from './session-refresh'
import { resetSessionProbe } from './session-health'
import { clearTokens, setAuthoritativeTokens } from './session-tokens'

/**
 * A 401 must never trigger a refresh that the backend is guaranteed to reject.
 *
 * Core issues refresh tokens with `nbf = accessTokenExp - 15m`, so for most of a
 * session's life /v1/refresh cannot succeed. The reactive 401 path used to call
 * it anyway; refresh-token.ts reads that predictable failure as `rejected`,
 * which raises session-expired, whose modal calls signOut(), whose NextAuth
 * event POSTs /v1/logout and REVOKES the tokens and session server-side. One
 * unrelated 401 could therefore destroy a valid session — and, when a session is
 * shared (as in the e2e suite), everyone else's too.
 *
 * recoverTokensAfterUnauthorized keeps the useful half of that path — adopting a
 * token another tab or request already obtained — and gates only the network
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
  calls = []
  lockQueues.clear()
  clearTokens()
  resetSessionProbe()
  refreshResponse = () => new Response(JSON.stringify({ access_token: freshToken('refreshed'), refresh_token: 'r-refreshed' }), { status: 200, headers: { 'content-type': 'application/json' } })
})

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
