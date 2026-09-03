import { adoptSessionTokens, clearTokens, getKnownTokens, getTokenGeneration, observeSessionTokens, readTokenRefreshAt } from './session-tokens'

// observe and adopt differ only on ties: a probe is a guess so it may only move forward, the
// session hook is authoritative so it may replace an equal-vintage pair.

const HOUR_S = 60 * 60

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

const makeToken = (id: string, { issuedSecondsAgo = 0, lifetimeSeconds = HOUR_S }: { issuedSecondsAgo?: number; lifetimeSeconds?: number } = {}): string => {
  const iat = Math.floor(Date.now() / 1000) - issuedSecondsAgo
  return `${b64({ alg: 'none' })}.${b64({ id, iat, exp: iat + lifetimeSeconds })}.`
}

beforeEach(() => {
  clearTokens()
})

describe('observeSessionTokens', () => {
  test('adopts the first pair it sees', () => {
    const access = makeToken('first')

    const observed = observeSessionTokens(access, 'r-first')

    expect(observed.accessToken).toBe(access)
    expect(getKnownTokens()?.accessToken).toBe(access)
  })

  test('adopts a pair issued later', () => {
    observeSessionTokens(makeToken('old', { issuedSecondsAgo: 600 }), 'r-old')
    const newer = makeToken('newer')

    expect(observeSessionTokens(newer, 'r-newer').accessToken).toBe(newer)
  })

  test('ignores a pair issued earlier', () => {
    const current = makeToken('current')
    observeSessionTokens(current, 'r-current')

    const observed = observeSessionTokens(makeToken('older', { issuedSecondsAgo: 600 }), 'r-older')

    expect(observed.accessToken).toBe(current)
  })

  test('breaks an issuedAt tie on the later refreshAt', () => {
    const shortLived = makeToken('short', { lifetimeSeconds: HOUR_S })
    observeSessionTokens(shortLived, 'r-short')
    const longLived = makeToken('long', { lifetimeSeconds: 2 * HOUR_S })

    expect(observeSessionTokens(longLived, 'r-long').accessToken).toBe(longLived)
    expect(observeSessionTokens(shortLived, 'r-short').accessToken).toBe(longLived)
  })

  test('ignores an equally vintage pair', () => {
    const current = makeToken('current')
    observeSessionTokens(current, 'r-current')

    expect(observeSessionTokens(makeToken('sibling'), 'r-sibling').accessToken).toBe(current)
  })
})

describe('adoptSessionTokens', () => {
  test('replaces an equally vintage pair that observeSessionTokens would ignore', () => {
    observeSessionTokens(makeToken('current'), 'r-current')
    const authoritative = makeToken('authoritative')

    expect(adoptSessionTokens(authoritative, 'r-authoritative').accessToken).toBe(authoritative)
  })

  test('keeps the current pair when it is strictly newer', () => {
    const current = makeToken('current')
    observeSessionTokens(current, 'r-current')

    expect(adoptSessionTokens(makeToken('older', { issuedSecondsAgo: 600 }), 'r-older').accessToken).toBe(current)
  })
})

describe('refresh token rotation', () => {
  test('merges a rotated refresh token onto an unchanged access token', () => {
    const access = makeToken('stable')
    observeSessionTokens(access, 'r-first')

    const merged = observeSessionTokens(access, 'r-rotated')

    expect(merged.accessToken).toBe(access)
    expect(merged.refreshToken).toBe('r-rotated')
  })

  test('does not bump the generation when nothing changed', () => {
    const access = makeToken('stable')
    observeSessionTokens(access, 'r-first')
    const generation = getTokenGeneration()

    observeSessionTokens(access, 'r-first')

    expect(getTokenGeneration()).toBe(generation)
  })

  test('bumps the generation when the refresh token rotates', () => {
    const access = makeToken('stable')
    observeSessionTokens(access, 'r-first')
    const generation = getTokenGeneration()

    observeSessionTokens(access, 'r-rotated')

    expect(getTokenGeneration()).toBe(generation + 1)
  })

  test('ignores an empty refresh token rather than clearing the stored one', () => {
    const access = makeToken('stable')
    observeSessionTokens(access, 'r-first')

    expect(observeSessionTokens(access, '').refreshToken).toBe('r-first')
  })
})

describe('readTokenRefreshAt', () => {
  test('returns null for an undecodable access token', () => {
    expect(readTokenRefreshAt('not-a-jwt')).toBeNull()
  })
})
