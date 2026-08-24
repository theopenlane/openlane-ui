import { fetchNewAccessToken } from './refresh-token'
import { probeSession, resetSessionProbe } from './session-health'

/**
 * `rejected` and `signed-out` are destructive verdicts: they end at the
 * session-expired modal, which signs out and revokes the tokens and the server
 * session. Anything that is merely an infrastructure answer — a 403 from a CSRF
 * or policy failure, a 404/405 from a bad deploy, a proxy 5xx, a truncated body
 * — must stay `unavailable` so a live user is not logged out by a blip.
 *
 * So both classifiers are allowlists for the destructive outcome, and these
 * tests pin the allowlist rather than the (open-ended) recoverable set.
 */

const globals = globalThis as unknown as { fetch: typeof fetch }
const originalFetch = globals.fetch

let respond: (url: string) => Response

globals.fetch = (async (input: RequestInfo | URL) => respond(String(input))) as typeof fetch

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const csrfOr = (fallback: (url: string) => Response) => (url: string) => (url.includes('/csrf') ? json({ csrf: 'test-csrf' }) : fallback(url))

afterAll(() => {
  globals.fetch = originalFetch
})

beforeEach(() => {
  resetSessionProbe()
})

describe('refresh response classification', () => {
  test.each([400, 401])('%i means the credential is dead', async (status) => {
    respond = csrfOr(() => new Response('nope', { status }))
    expect((await fetchNewAccessToken('r')).status).toBe('rejected')
  })

  test.each([403, 404, 405, 408, 425, 429, 500, 502, 503])('%i stays recoverable', async (status) => {
    respond = csrfOr(() => new Response('nope', { status }))
    expect((await fetchNewAccessToken('r')).status).toBe('unavailable')
  })

  test('a 2xx without an access token is recoverable, not a rejection', async () => {
    respond = csrfOr(() => json({}))
    expect((await fetchNewAccessToken('r')).status).toBe('unavailable')
  })

  test('an unparseable 2xx body is recoverable, not a rejection', async () => {
    respond = csrfOr(() => new Response('<html>gateway</html>', { status: 200, headers: { 'content-type': 'application/json' } }))
    expect((await fetchNewAccessToken('r')).status).toBe('unavailable')
  })

  test('keeps the submitted refresh token when the response does not rotate it', async () => {
    respond = csrfOr(() => json({ access_token: 'new-access' }))
    const result = await fetchNewAccessToken('original-refresh')

    expect(result.status).toBe('ok')
    if (result.status === 'ok') expect(result.tokens.refreshToken).toBe('original-refresh')
  })
})

describe('session probe classification', () => {
  test('a 200 carrying no access token is a real signed-out session', async () => {
    respond = () => json(null)
    expect((await probeSession({ maxAgeMs: 0 })).status).toBe('signed-out')
  })

  test.each([401, 403, 404, 500, 502])('%i is an infrastructure answer, not a sign-out', async (status) => {
    respond = () => new Response('nope', { status })
    expect((await probeSession({ maxAgeMs: 0 })).status).toBe('unavailable')
  })

  test('a 200 with an access token is available', async () => {
    respond = () => json({ user: { accessToken: 'a', refreshToken: 'r' } })
    expect((await probeSession({ maxAgeMs: 0 })).status).toBe('available')
  })
})
