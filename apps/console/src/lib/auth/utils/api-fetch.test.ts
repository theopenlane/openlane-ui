import { apiFetch } from './api-fetch'
import { invalidateCSRFToken } from './secure-fetch'
import { resetSessionProbe } from './session-health'
import { resetSessionStatus } from './session-status'
import { clearTokens, setAuthoritativeTokens } from './session-tokens'

// /api routes authenticate with the session cookie, not a header, so there is no credential
// to build up front. These pin that the happy path stays a plain fetch.

const HOUR_S = 60 * 60

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

const makeToken = (id: string, expiresInSeconds: number): string => {
  const now = Math.floor(Date.now() / 1000)
  return `${b64({ alg: 'none' })}.${b64({ id, iat: now - (HOUR_S - expiresInSeconds), exp: now + expiresInSeconds })}.`
}

const freshToken = (id: string) => makeToken(id, HOUR_S)
const dueToken = (id: string) => makeToken(id, 30)

const globals = globalThis as unknown as { navigator?: unknown; window?: unknown; fetch: typeof fetch }
const originalNavigator = globals.navigator
const originalWindow = globals.window
const originalFetch = globals.fetch

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
let apiResponse: (attempt: number) => Response

globals.navigator = { locks: locksStub }
globals.window = { dispatchEvent: () => true }
globals.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input)
  calls.push(url)

  if (url.includes('/api/auth/session')) {
    return new Response(JSON.stringify(sessionTokens ? { user: sessionTokens } : {}), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  if (url.includes('/csrf')) {
    return new Response(JSON.stringify({ csrf: 'test-csrf' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  if (url.includes('/v1/refresh')) {
    const rotated = { accessToken: freshToken(`refreshed-${calls.length}`), refreshToken: `r-refreshed-${calls.length}` }
    sessionTokens = rotated
    return new Response(JSON.stringify({ access_token: rotated.accessToken, refresh_token: rotated.refreshToken }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  return apiResponse(calls.filter((c) => c.includes('/api/reports')).length)
}) as typeof fetch

afterAll(() => {
  globals.navigator = originalNavigator
  globals.window = originalWindow
  globals.fetch = originalFetch
  invalidateCSRFToken()
})

beforeEach(() => {
  calls = []
  lockQueues.clear()
  clearTokens()
  resetSessionProbe()
  resetSessionStatus()
  sessionTokens = null
  apiResponse = () => new Response('{}', { status: 200 })
})

const apiCalls = () => calls.filter((c) => c.includes('/api/reports')).length
const probeCalls = () => calls.filter((c) => c.includes('/api/auth/session')).length
const refreshCalls = () => calls.filter((c) => c.includes('/v1/refresh')).length

describe('apiFetch', () => {
  test('a successful call is a plain fetch — no probe, no refresh', async () => {
    setAuthoritativeTokens(dueToken('due'), 'r-due')

    const response = await apiFetch('/api/reports')

    expect(response.status).toBe(200)
    expect(apiCalls()).toBe(1)
    expect(probeCalls()).toBe(0)
    expect(refreshCalls()).toBe(0)
  })

  test('a non-401 failure is returned without waking the recovery machinery', async () => {
    setAuthoritativeTokens(dueToken('due'), 'r-due')
    apiResponse = () => new Response('{}', { status: 403 })

    const response = await apiFetch('/api/reports')

    expect(response.status).toBe(403)
    expect(probeCalls()).toBe(0)
    expect(refreshCalls()).toBe(0)
  })

  test('a 401 resolves a credential, refreshes, and retries', async () => {
    const access = dueToken('due')
    setAuthoritativeTokens(access, 'r-due')
    sessionTokens = { accessToken: access, refreshToken: 'r-due' }
    apiResponse = (attempt) => new Response('{}', { status: attempt === 1 ? 401 : 200 })

    const response = await apiFetch('/api/reports')

    expect(response.status).toBe(200)
    expect(apiCalls()).toBe(2)
    expect(refreshCalls()).toBe(1)
  })

  test('forwards the caller init while still sending credentials', async () => {
    setAuthoritativeTokens(freshToken('fresh'), 'r-fresh')
    let seen: RequestInit | undefined
    const stubbed = globals.fetch

    globals.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen = init
      calls.push('/api/reports')
      return new Response('{}', { status: 200 })
    }) as typeof fetch

    try {
      await apiFetch('/api/reports', { method: 'POST', body: '{"a":1}' })
    } finally {
      globals.fetch = stubbed
    }

    expect(seen?.method).toBe('POST')
    expect(seen?.credentials).toBe('include')
  })

  test('returns the original 401 when no credential can be resolved, rather than throwing', async () => {
    apiResponse = () => new Response('{}', { status: 401 })

    const originalError = console.error
    console.error = () => {}

    try {
      const response = await apiFetch('/api/reports')

      expect(response.status).toBe(401)
      expect(apiCalls()).toBe(1)
    } finally {
      console.error = originalError
    }
  })
})
