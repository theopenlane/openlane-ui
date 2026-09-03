import { MAX_CREDENTIAL_RETRIES, noteAuthorizedResponse, sendWithUnauthorizedRecovery } from './unauthorized-recovery'
import { invalidateCSRFToken } from './secure-fetch'
import { resetSessionProbe } from './session-health'
import { markSessionExpired, resetSessionStatus, SESSION_EXPIRED_EVENT } from './session-status'
import { clearTokens, setAuthoritativeTokens, type TokenState } from './session-tokens'

// Three rungs: adopt a token someone else installed, refresh when due, force a refresh when
// not. The third is the only repair for a session cookie that outlived the access token.

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
let refreshCount = 0
let nextRefreshTokens: () => { accessToken: string; refreshToken: string }

// Both expiry and SSO re-auth dispatch here, so assert on the event name, not the count.
const dispatchedEvents: string[] = []

globals.navigator = { locks: locksStub }
globals.window = {
  dispatchEvent: (event: Event) => {
    dispatchedEvents.push(event.type)
    return true
  },
}
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
    refreshCount += 1
    const tokens = nextRefreshTokens()
    sessionTokens = tokens
    return new Response(JSON.stringify({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  throw new Error(`unexpected fetch: ${url}`)
}) as typeof fetch

afterAll(() => {
  globals.navigator = originalNavigator
  globals.window = originalWindow
  globals.fetch = originalFetch

  // Defining `window` lets fetchCSRFToken cache; secure-fetch.test.ts asserts on that cache.
  invalidateCSRFToken()
})

beforeEach(() => {
  lockQueues.clear()
  clearTokens()
  resetSessionProbe()
  resetSessionStatus()
  noteAuthorizedResponse()
  calls = []
  refreshCount = 0
  dispatchedEvents.length = 0
  sessionTokens = null
  nextRefreshTokens = () => ({ accessToken: freshToken(`refreshed-${refreshCount}`), refreshToken: `r-refreshed-${refreshCount}` })
})

const probeCalls = () => calls.filter((c) => c.includes('/api/auth/session')).length

const unauthorized = () => new Response('{}', { status: 401, headers: { 'content-type': 'application/json' } })
const ok = () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })

const recordingSend = (respond: (attempt: number, tokens: TokenState) => Response) => {
  const seen: TokenState[] = []

  const send = async (tokens: TokenState) => {
    seen.push(tokens)
    return respond(seen.length, tokens)
  }

  return { send, seen }
}

describe('sendWithUnauthorizedRecovery', () => {
  test('passes a non-401 response straight through with a single send', async () => {
    const current = setAuthoritativeTokens(freshToken('a'), 'r-a')
    const { send, seen } = recordingSend(() => ok())

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(200)
    expect(seen).toHaveLength(1)
    expect(refreshCount).toBe(0)
  })

  test('does not retry a 401 it cannot obtain a new credential for', async () => {
    const current = setAuthoritativeTokens(freshToken('a'), '')
    const { send, seen } = recordingSend(() => unauthorized())

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(dispatchedEvents).not.toContain(SESSION_EXPIRED_EVENT)
  })

  test('adopts a token another request installed and retries once, without the network', async () => {
    const failed: TokenState = { accessToken: freshToken('stale'), refreshToken: 'r-stale', issuedAt: 0, refreshAt: 0 }
    setAuthoritativeTokens(freshToken('installed'), 'r-installed')

    const { send, seen } = recordingSend((attempt) => (attempt === 1 ? unauthorized() : ok()))

    const response = await sendWithUnauthorizedRecovery(failed, send)

    expect(response.status).toBe(200)
    expect(seen).toHaveLength(2)
    expect(refreshCount).toBe(0)
  })

  // The regression this module exists for: the token is nowhere near due, so recovery used
  // to decline and the 401 was permanent.
  test('forces a refresh for a 401 while the access token is still fresh', async () => {
    const access = freshToken('fresh')
    const current = setAuthoritativeTokens(access, 'r-fresh')
    sessionTokens = { accessToken: access, refreshToken: 'r-fresh' }

    const { send, seen } = recordingSend((attempt) => (attempt === 1 ? unauthorized() : ok()))

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(200)
    expect(refreshCount).toBe(1)
    expect(seen).toHaveLength(2)
    expect(seen[1].accessToken).not.toBe(access)
  })

  test('refreshes without forcing when the access token is already due', async () => {
    const access = dueToken('due')
    const current = setAuthoritativeTokens(access, 'r-due')
    sessionTokens = { accessToken: access, refreshToken: 'r-due' }

    const { send } = recordingSend((attempt) => (attempt === 1 ? unauthorized() : ok()))

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(200)
    expect(refreshCount).toBe(1)
  })

  test('stops immediately when an SSO re-authentication is required', async () => {
    const access = dueToken('due')
    const current = setAuthoritativeTokens(access, 'r-due')
    sessionTokens = { accessToken: access, refreshToken: 'r-due' }

    const ssoRequired = () => new Response(JSON.stringify({ sso_required: true, organization_id: 'org-1' }), { status: 401, headers: { 'content-type': 'application/json' } })
    const { send, seen } = recordingSend(() => ssoRequired())

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(refreshCount).toBe(0)
    expect(dispatchedEvents).not.toContain(SESSION_EXPIRED_EVENT)
  })

  // Core's `nbf` means one request can't mint five replacements on its own, so this count is
  // reached by concurrent churn, not a dead session. Logging out on it would be wrong.
  test('bounds the retries and surfaces the 401 without ending the session', async () => {
    const access = dueToken('due')
    const current = setAuthoritativeTokens(access, 'r-due')
    sessionTokens = { accessToken: access, refreshToken: 'r-due' }

    const { send, seen } = recordingSend(() => unauthorized())

    const originalError = console.error
    console.error = () => {}

    try {
      const response = await sendWithUnauthorizedRecovery(current, send)

      expect(response.status).toBe(401)
      expect(seen).toHaveLength(MAX_CREDENTIAL_RETRIES + 1)
      expect(dispatchedEvents).not.toContain(SESSION_EXPIRED_EVENT)
    } finally {
      console.error = originalError
    }
  })

  // Finding out it's too early costs a probe under the refresh lock, which a burst of 401s
  // would serialize into a convoy.
  test('does not attempt a forced refresh before the refresh token is valid', async () => {
    const access = freshToken('fresh')
    const notYetValid = `${b64({ alg: 'none' })}.${b64({ nbf: Math.floor(Date.now() / 1000) + HOUR_S })}.`
    const current = setAuthoritativeTokens(access, notYetValid)
    sessionTokens = { accessToken: access, refreshToken: notYetValid }

    const { send, seen } = recordingSend(() => unauthorized())

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(refreshCount).toBe(0)
    expect(probeCalls()).toBe(1)
  })
})

describe('a tab that cannot authenticate anything', () => {
  const sendUnauthorized = async () => {
    const access = freshToken('fresh')
    const current = setAuthoritativeTokens(access, 'r-fresh')
    sessionTokens = { accessToken: access, refreshToken: 'r-fresh' }

    const { send } = recordingSend(() => unauthorized())

    return await sendWithUnauthorizedRecovery(current, send)
  }

  test('ends the session once nothing has authenticated for a whole streak', async () => {
    const originalError = console.error
    console.error = () => {}

    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await sendUnauthorized()
      }

      expect(dispatchedEvents).toContain(SESSION_EXPIRED_EVENT)
    } finally {
      console.error = originalError
    }
  })

  test('a single successful response resets the streak', async () => {
    const originalError = console.error
    console.error = () => {}

    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sendUnauthorized()
      }

      const current = setAuthoritativeTokens(freshToken('ok'), 'r-ok')
      await sendWithUnauthorizedRecovery(current, async () => ok())

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sendUnauthorized()
      }

      expect(dispatchedEvents).not.toContain(SESSION_EXPIRED_EVENT)
    } finally {
      console.error = originalError
    }
  })
})

describe('sendWithUnauthorizedRecovery after the session is invalidated', () => {
  test('does not retry, refresh, or re-expire', async () => {
    const current = setAuthoritativeTokens(freshToken('a'), 'r-a')
    const { send, seen } = recordingSend(() => unauthorized())

    markSessionExpired()
    dispatchedEvents.length = 0

    const response = await sendWithUnauthorizedRecovery(current, send)

    expect(response.status).toBe(401)
    expect(seen).toHaveLength(1)
    expect(refreshCount).toBe(0)
    expect(dispatchedEvents).not.toContain(SESSION_EXPIRED_EVENT)
  })
})
