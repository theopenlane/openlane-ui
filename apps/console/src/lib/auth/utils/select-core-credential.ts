import type { Session } from 'next-auth'
import { describeToken, isClaimExpired, readAccessTokenClaims, type TokenDescription } from './token-claims'

export type CoreCredential = { kind: 'caller'; accessToken: string } | { kind: 'session'; accessToken: string } | { kind: 'rejected'; reason: string }

export interface CredentialLog {
  selected: CoreCredential['kind']
  reason?: string
  session: TokenDescription | null
  caller: TokenDescription | null
  callerSentBearer: boolean
}

// PATs and API tokens have no user_id to bind to, they go to core directly.
const OPAQUE_TOKEN_PREFIXES = ['tolp_', 'tola_']

const readBearer = (authorization: string | null): string | null | undefined => {
  if (!authorization) {
    return null
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim())

  return match ? match[1] : undefined
}

const impersonationMatches = (session: Session['user'], claims: NonNullable<ReturnType<typeof readAccessTokenClaims>>): boolean =>
  (claims.impersonator_id ?? null) === (session.impersonator ?? null) &&
  (claims.session_id ?? null) === (session.impersonationSessionId ?? null) &&
  (claims.org ?? null) === (session.activeOrganizationId ?? null)

// Which token a server route forwards to core. The browser's bearer wins when it's there,
// bound to the signed-in user, since the copy in the NextAuth cookie tends to lag behind it.
// No bearer means the cookie. A wrong bearer is a 401, not a fallback. Core does the real
// validation, the decode here only picks.
export const selectCoreCredential = (session: Session | null, authorization: string | null): CoreCredential => {
  if (!session?.user?.userId) {
    return { kind: 'rejected', reason: 'no signed-in user' }
  }

  const bearer = readBearer(authorization)

  if (bearer === null) {
    return session.user.accessToken ? { kind: 'session', accessToken: session.user.accessToken } : { kind: 'rejected', reason: 'no credential' }
  }

  if (bearer === undefined) {
    return { kind: 'rejected', reason: 'malformed authorization header' }
  }

  if (OPAQUE_TOKEN_PREFIXES.some((prefix) => bearer.startsWith(prefix))) {
    return { kind: 'rejected', reason: 'opaque token not accepted on this route' }
  }

  const claims = readAccessTokenClaims(bearer)

  if (!claims) {
    return { kind: 'rejected', reason: 'undecodable bearer' }
  }

  if (isClaimExpired(claims)) {
    return { kind: 'rejected', reason: 'bearer expired' }
  }

  if (typeof claims.user_id !== 'string' || claims.user_id === '' || claims.user_id !== session.user.userId) {
    return { kind: 'rejected', reason: 'bearer belongs to a different user' }
  }

  const bearerIsImpersonation = claims.type === 'support' || !!claims.impersonator_id

  if (bearerIsImpersonation !== !!session.user.isImpersonation) {
    return { kind: 'rejected', reason: 'impersonation class mismatch' }
  }

  if (bearerIsImpersonation && !impersonationMatches(session.user, claims)) {
    return { kind: 'rejected', reason: 'impersonation context mismatch' }
  }

  return { kind: 'caller', accessToken: bearer }
}

export const describeCredential = (session: Session | null, authorization: string | null, selection: CoreCredential): CredentialLog => {
  const bearer = readBearer(authorization)

  return {
    selected: selection.kind,
    ...(selection.kind === 'rejected' ? { reason: selection.reason } : {}),
    session: describeToken(session?.user?.accessToken),
    caller: describeToken(bearer ?? undefined),
    callerSentBearer: bearer !== null,
  }
}
