import type { JWT } from '@auth/core/jwt'
import { applyTokenUpdate } from './jwt-token-update'

// Replaced a blind `{ ...token, ...session?.user }` spread. update() is caller-supplied, so
// the rejections below are the whole point — a bad token must not displace a working pair.

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
const tokenWithClaims = (claims: object) => `${b64({ alg: 'none' })}.${b64(claims)}.`

const accessTokenExpiringIn = (seconds: number) => {
  const now = Math.floor(Date.now() / 1000)
  return tokenWithClaims({ iat: now, exp: now + seconds })
}

const existing: JWT = { accessToken: 'a-existing', refreshToken: 'r-existing', isTfaEnabled: false, isOnboarding: false }

let errors: unknown[] = []
const originalError = console.error

beforeEach(() => {
  errors = []
  console.error = (...args: unknown[]) => {
    errors.push(args[0])
  }
})

afterEach(() => {
  console.error = originalError
})

describe('applyTokenUpdate', () => {
  test('stores a valid access and refresh token pair', () => {
    const accessToken = accessTokenExpiringIn(3600)

    const next = applyTokenUpdate(existing, { user: { accessToken, refreshToken: 'r-new' } })

    expect(next.accessToken).toBe(accessToken)
    expect(next.refreshToken).toBe('r-new')
  })

  test('keeps the existing pair when the update carries an already expired access token', () => {
    const next = applyTokenUpdate(existing, { user: { accessToken: accessTokenExpiringIn(-1), refreshToken: 'r-new' } })

    expect(next.accessToken).toBe('a-existing')
    expect(next.refreshToken).toBe('r-existing')
    expect(errors).toContain('[jwt-token-update] rejected a session update carrying an already expired access token')
  })

  test('keeps the existing pair when the access token cannot be decoded', () => {
    const next = applyTokenUpdate(existing, { user: { accessToken: 'not-a-jwt', refreshToken: 'r-new' } })

    expect(next.accessToken).toBe('a-existing')
    expect(next.refreshToken).toBe('r-existing')
    expect(errors).toContain('[jwt-token-update] rejected a session update carrying an undecodable access token')
  })

  test('keeps the existing pair when only one half of the pair is present', () => {
    const accessToken = accessTokenExpiringIn(3600)

    const next = applyTokenUpdate(existing, { user: { accessToken } })

    expect(next.accessToken).toBe('a-existing')
    expect(next.refreshToken).toBe('r-existing')
    expect(errors).toHaveLength(0)
  })

  test('applies the session flags independently of the token pair', () => {
    const next = applyTokenUpdate(existing, { user: { isTfaEnabled: true, isOnboarding: true } })

    expect(next.isTfaEnabled).toBe(true)
    expect(next.isOnboarding).toBe(true)
    expect(next.accessToken).toBe('a-existing')
  })

  test('applies the session flags even when the token pair is rejected', () => {
    const next = applyTokenUpdate(existing, { user: { isTfaEnabled: true, accessToken: 'not-a-jwt', refreshToken: 'r-new' } })

    expect(next.isTfaEnabled).toBe(true)
    expect(next.accessToken).toBe('a-existing')
  })

  test('returns the token unchanged for an undefined update', () => {
    expect(applyTokenUpdate(existing, undefined)).toEqual(existing)
  })

  test('does not mutate the token it was given', () => {
    applyTokenUpdate(existing, { user: { accessToken: accessTokenExpiringIn(3600), refreshToken: 'r-new', isTfaEnabled: true } })

    expect(existing.accessToken).toBe('a-existing')
    expect(existing.isTfaEnabled).toBe(false)
  })

  // No usable `exp` means toTokenState gives it refreshAt: Infinity — a pair that never
  // refreshes and always wins the freshness comparison.
  test.each([
    ['no exp claim', {}],
    ['exp: 0', { exp: 0 }],
    ['a non-numeric exp', { exp: 'soon' }],
  ])('rejects an access token with %s', (_label, claims) => {
    const accessToken = tokenWithClaims({ iat: Math.floor(Date.now() / 1000), ...claims })

    const next = applyTokenUpdate(existing, { user: { accessToken, refreshToken: 'r-new' } })

    expect(next.accessToken).toBe('a-existing')
    expect(errors).toContain('[jwt-token-update] rejected a session update carrying an access token with no usable expiry')
  })
})
