import { probeSession, resetSessionProbe } from './session-health'

/**
 * `signed-out` is a destructive verdict: it ends at the session-expired modal,
 * which revokes the tokens and the server session. The classifier is therefore
 * an allowlist, and these tests pin the allowlist rather than the open-ended
 * recoverable set.
 */

const globals = globalThis as unknown as { fetch: typeof fetch }
const originalFetch = globals.fetch

let respond: (url: string) => Response

globals.fetch = (async (input: RequestInfo | URL) => respond(String(input))) as typeof fetch

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

afterAll(() => {
  globals.fetch = originalFetch
})

beforeEach(() => {
  resetSessionProbe()
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
