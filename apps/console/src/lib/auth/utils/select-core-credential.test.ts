import type { Session } from 'next-auth'
import { selectCoreCredential } from './select-core-credential'

// The bridge from a signed-in NextAuth session to the token we forward to core. The browser's
// bearer wins when it's present and belongs to the same user; a bearer that's present but
// wrong is a rejection, never a quiet fallback to the cookie.

const HOUR_S = 60 * 60
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
const token = (claims: object) => `${b64({ alg: 'none' })}.${b64(claims)}.`

const now = () => Math.floor(Date.now() / 1000)
const userToken = (overrides: object = {}) => token({ jti: 'j-caller', user_id: 'u-1', org: 'org-1', iat: now(), exp: now() + HOUR_S, ...overrides })

const sessionFor = (user: Partial<Session['user']>): Session => ({
  expires: new Date(Date.now() + HOUR_S * 1000).toISOString(),
  user: { id: 'u-1', userId: 'u-1', accessToken: 'session-token', refreshToken: 'r', activeOrganizationId: 'org-1', image: '', isTfaEnabled: false, isOnboarding: false, modules: [], ...user },
})

const bearer = (t: string) => `Bearer ${t}`

describe('selectCoreCredential', () => {
  test('no session means no credential, whatever the header says', () => {
    expect(selectCoreCredential(null, bearer(userToken()))).toEqual({ kind: 'rejected', reason: 'no signed-in user' })
  })

  test('falls back to the session token when the caller sent no bearer', () => {
    expect(selectCoreCredential(sessionFor({}), null)).toEqual({ kind: 'session', accessToken: 'session-token' })
  })

  test('rejects when there is neither a bearer nor a session token', () => {
    expect(selectCoreCredential(sessionFor({ accessToken: '' }), null).kind).toBe('rejected')
  })

  test("uses the caller's bearer when it belongs to the signed-in user", () => {
    const t = userToken()

    expect(selectCoreCredential(sessionFor({}), bearer(t))).toEqual({ kind: 'caller', accessToken: t })
  })

  test("uses the caller's bearer even when its org differs from the session's", () => {
    // Org switch: the caller holds the new org's token while the cookie still says the old one.
    const t = userToken({ org: 'org-2' })

    expect(selectCoreCredential(sessionFor({ activeOrganizationId: 'org-1' }), bearer(t)).kind).toBe('caller')
  })

  test.each([
    ['a malformed header', 'Token abc', 'malformed authorization header'],
    ['a personal access token', bearer('tolp_abc'), 'opaque token not accepted on this route'],
    ['an API token', bearer('tola_abc'), 'opaque token not accepted on this route'],
    ['an undecodable bearer', bearer('not-a-jwt'), 'undecodable bearer'],
    ['an expired bearer', bearer(userToken({ exp: now() - 1 })), 'bearer expired'],
    ["another user's bearer", bearer(userToken({ user_id: 'u-2' })), 'bearer belongs to a different user'],
    ['a bearer with no user_id', bearer(token({ jti: 'j', iat: now(), exp: now() + HOUR_S })), 'bearer belongs to a different user'],
  ])('rejects %s instead of falling back to the session', (_label, header, reason) => {
    expect(selectCoreCredential(sessionFor({}), header)).toEqual({ kind: 'rejected', reason })
  })

  describe('impersonation', () => {
    const supportSession = sessionFor({ isImpersonation: true, impersonator: 'op-1', impersonationSessionId: 's-1', activeOrganizationId: 'org-1' })
    const supportToken = (overrides: object = {}) => userToken({ type: 'support', impersonator_id: 'op-1', session_id: 's-1', org: 'org-1', ...overrides })

    test('accepts a support bearer that matches the support session', () => {
      expect(selectCoreCredential(supportSession, bearer(supportToken())).kind).toBe('caller')
    })

    test('rejects a plain user bearer on a support session', () => {
      expect(selectCoreCredential(supportSession, bearer(userToken()))).toEqual({ kind: 'rejected', reason: 'impersonation class mismatch' })
    })

    test('rejects a support bearer on a plain user session', () => {
      expect(selectCoreCredential(sessionFor({}), bearer(supportToken()))).toEqual({ kind: 'rejected', reason: 'impersonation class mismatch' })
    })

    test.each([
      ['operator', { impersonator_id: 'op-2' }],
      ['support session id', { session_id: 's-2' }],
      ['org', { org: 'org-2' }],
    ])('rejects a support bearer whose %s differs from the session', (_label, overrides) => {
      expect(selectCoreCredential(supportSession, bearer(supportToken(overrides)))).toEqual({ kind: 'rejected', reason: 'impersonation context mismatch' })
    })
  })
})
