import type { JWT } from '@auth/core/jwt'
import { refreshSessionToken } from './refresh-session-token'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const ACCESS_TTL = HOUR
const REFRESH_TTL = 2 * HOUR
const REFRESH_OVERLAP = 15 * MINUTE

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

const unsignedToken = (claims: Record<string, unknown>) => `${encode({ alg: 'none' })}.${encode(claims)}.sig`

const seconds = (ms: number) => Math.floor(ms / 1000)

// tokenPair mints an access and refresh token the way core does relative to an issue time
const tokenPair = (issuedAt: number, id = 'a') => {
  const accessExp = issuedAt + ACCESS_TTL

  return {
    accessToken: unsignedToken({ id, iat: seconds(issuedAt), exp: seconds(accessExp) }),
    refreshToken: unsignedToken({ id, iat: seconds(issuedAt), nbf: seconds(accessExp - REFRESH_OVERLAP), exp: seconds(issuedAt + REFRESH_TTL) }),
  }
}

const T0 = Date.parse('2026-09-16T09:00:00Z')

const sessionToken = (pair: { accessToken: string; refreshToken: string }): JWT => ({ ...pair, name: 'user' })

const json = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

type RefreshReply = () => Response

// stubCore answers the CSRF fetch and the refresh call, recording the refresh tokens presented
const stubCore = (reply: RefreshReply) => {
  const refreshed: string[] = []

  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)

    if (url.endsWith('/csrf')) {
      return json(200, { csrf: 'csrf-token' })
    }

    if (url.endsWith('/v1/refresh')) {
      refreshed.push(JSON.parse(String(init?.body)).refresh_token)

      return reply()
    }

    throw new Error(`unexpected fetch ${url}`)
  })

  return refreshed
}

describe('refreshSessionToken', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(T0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('leaves a fresh token pair alone', async () => {
    const refreshed = stubCore(() => json(200, {}))
    const token = sessionToken(tokenPair(T0))
    jest.setSystemTime(T0 + 30 * MINUTE)

    expect(await refreshSessionToken(token)).toBe(token)
    expect(refreshed).toHaveLength(0)
  })

  test('refreshes once the access token is inside the buffer', async () => {
    const refreshedAt = T0 + ACCESS_TTL - 30_000
    const next = tokenPair(refreshedAt, 'b')
    const refreshed = stubCore(() => json(200, { access_token: next.accessToken, refresh_token: next.refreshToken }))
    const token = sessionToken(tokenPair(T0))
    jest.setSystemTime(refreshedAt)

    const result = await refreshSessionToken(token)

    expect(refreshed).toEqual([token.refreshToken])
    expect(result).toMatchObject({ ...next, name: 'user' })
  })

  test('waits for the refresh token to become valid', async () => {
    const refreshed = stubCore(() => json(200, {}))
    const pair = tokenPair(T0)
    const token = sessionToken({ ...pair, accessToken: unsignedToken({ exp: seconds(T0 + 20 * MINUTE) }) })
    jest.setSystemTime(T0 + 20 * MINUTE)

    expect(await refreshSessionToken(token)).toBe(token)
    expect(refreshed).toHaveLength(0)
  })

  test('ends the session once the refresh token has expired', async () => {
    const refreshed = stubCore(() => json(200, {}))
    const token = sessionToken(tokenPair(T0))
    jest.setSystemTime(T0 + REFRESH_TTL)

    expect(await refreshSessionToken(token)).toBeNull()
    expect(refreshed).toHaveLength(0)
  })

  test('ends the session when core rejects the refresh token', async () => {
    stubCore(() => json(401, { error: 'unable to verify token' }))
    const token = sessionToken(tokenPair(T0))
    jest.setSystemTime(T0 + ACCESS_TTL)

    expect(await refreshSessionToken(token)).toBeNull()
  })

  test.each<[string, RefreshReply]>([
    ['unavailable', () => json(503, { error: 'down' })],
    ['sso required', () => json(401, { sso_required: true, organization_id: 'org' })],
  ])('keeps the token when the refresh is %s', async (_, reply) => {
    stubCore(reply)
    const token = sessionToken(tokenPair(T0))
    jest.setSystemTime(T0 + ACCESS_TTL)

    expect(await refreshSessionToken(token)).toBe(token)
  })

  test('ignores tokens it cannot read', async () => {
    const refreshed = stubCore(() => json(200, {}))
    const token: JWT = { accessToken: 'nope', refreshToken: 'nope' }

    expect(await refreshSessionToken(token)).toBe(token)
    expect(refreshed).toHaveLength(0)
  })

  test('keeps an active user signed in past the original refresh token lifetime', async () => {
    let issue = 0
    const refreshed = stubCore(() => {
      const next = tokenPair(Date.now(), `r${(issue += 1)}`)

      return json(200, { access_token: next.accessToken, refresh_token: next.refreshToken })
    })
    let token: JWT | null = sessionToken(tokenPair(T0))

    for (let elapsed = 0; elapsed <= 6 * HOUR; elapsed += 10 * MINUTE) {
      jest.setSystemTime(T0 + elapsed)
      token = await refreshSessionToken(token as JWT)
      expect(token).not.toBeNull()
    }

    expect(refreshed).toHaveLength(6)
  })

  test('signs an idle user out at the refresh token lifetime', async () => {
    const refreshedAt = T0 + ACCESS_TTL
    stubCore(() => {
      const next = tokenPair(Date.now(), 'late')

      return json(200, { access_token: next.accessToken, refresh_token: next.refreshToken })
    })
    const token = sessionToken(tokenPair(refreshedAt))

    jest.setSystemTime(refreshedAt + REFRESH_TTL - MINUTE)
    expect(await refreshSessionToken(token)).not.toBeNull()

    jest.setSystemTime(refreshedAt + REFRESH_TTL)
    expect(await refreshSessionToken(token)).toBeNull()
  })
})
