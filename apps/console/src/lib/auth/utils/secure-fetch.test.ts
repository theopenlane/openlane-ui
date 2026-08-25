import { fetchCSRFToken } from './secure-fetch'

/**
 * The CSRF token cache and in-flight dedupe (fetchCSRFToken) exist because
 * /csrf is rate-limited and was previously hit once per outbound request.
 *
 * The cache is module-level state, so these tests are ordered to walk a single
 * lifecycle rather than resetting it: the rejection case runs first (a failure
 * caches nothing), then the concurrent dedupe populates it, then the warm-cache
 * reuse reads it, and finally the server-side case asserts the cache is bypassed
 * entirely when there is no `window`.
 */

const globals = globalThis as unknown as { window?: unknown; fetch: typeof fetch }
const originalWindow = globals.window
const originalFetch = globals.fetch

let fetchCalls = 0
let respond: () => Promise<Response>

const jsonResponse = (csrf: string): Response =>
  new Response(JSON.stringify({ csrf }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

globals.window = globalThis
globals.fetch = (() => {
  fetchCalls++
  return respond()
}) as unknown as typeof fetch

afterAll(() => {
  globals.window = originalWindow
  globals.fetch = originalFetch
})

describe('fetchCSRFToken', () => {
  test('propagates a failed response and caches nothing', async () => {
    fetchCalls = 0
    respond = async () => new Response('nope', { status: 500, statusText: 'Server Error', headers: { 'content-type': 'application/json' } })

    await expect(fetchCSRFToken()).rejects.toThrow(/Failed to fetch CSRF token: 500/)
    expect(fetchCalls).toBe(1)

    // A rejection must clear the in-flight slot, otherwise every later caller
    // would await the same dead promise.
    await expect(fetchCSRFToken()).rejects.toThrow(/Failed to fetch CSRF token: 500/)
    expect(fetchCalls).toBe(2)
  })

  test('rejects an HTML response instead of parsing it as JSON', async () => {
    fetchCalls = 0
    respond = async () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html' } })

    await expect(fetchCSRFToken()).rejects.toThrow(/received HTML/i)
    expect(fetchCalls).toBe(1)
  })

  test('dedupes concurrent callers onto a single request', async () => {
    fetchCalls = 0
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    respond = async () => {
      await gate
      return jsonResponse('token-a')
    }

    const inFlight = [fetchCSRFToken(), fetchCSRFToken(), fetchCSRFToken(), fetchCSRFToken(), fetchCSRFToken()]
    release?.()
    const tokens = await Promise.all(inFlight)

    expect(fetchCalls).toBe(1)
    expect(tokens).toEqual(['token-a', 'token-a', 'token-a', 'token-a', 'token-a'])
  })

  test('serves later callers from the cache without a new request', async () => {
    fetchCalls = 0
    respond = async () => jsonResponse('token-b')

    expect(await fetchCSRFToken()).toBe('token-a')
    expect(await fetchCSRFToken()).toBe('token-a')
    expect(fetchCalls).toBe(0)
  })

  test('never caches when there is no window (server-side)', async () => {
    fetchCalls = 0
    respond = async () => jsonResponse('token-server')
    globals.window = undefined

    expect(await fetchCSRFToken()).toBe('token-server')
    expect(await fetchCSRFToken()).toBe('token-server')
    expect(fetchCalls).toBe(2)

    globals.window = globalThis
  })
})
