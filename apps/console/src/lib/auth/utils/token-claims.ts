import { jwtDecode } from 'jwt-decode'

export interface AccessTokenClaims {
  jti?: string
  exp?: number
  iat?: number
  user_id?: string
  org?: string
  type?: string
  impersonator_id?: string
  session_id?: string
}

export interface TokenDescription {
  jti: string
  userId: string | null
  org: string | null
  type: string | null
  impersonatorId: string | null
  sessionId: string | null
  ageSeconds: number | null
  expiresInSeconds: number | null
  expired: boolean
}

// Decode only. Core does the cryptographic validation; this is for routing and logging.
export const readAccessTokenClaims = (accessToken: string | undefined | null): AccessTokenClaims | null => {
  if (!accessToken) {
    return null
  }

  try {
    return jwtDecode<AccessTokenClaims>(accessToken)
  } catch {
    return null
  }
}

export const isClaimExpired = (claims: AccessTokenClaims): boolean => !!claims.exp && Math.floor(Date.now() / 1000) >= claims.exp

// Everything here is safe to log. jti identifies a token without being usable as one, so a
// stale-credential bug is readable from logs without ever printing a token.
export const describeToken = (accessToken: string | undefined | null): TokenDescription | null => {
  const claims = readAccessTokenClaims(accessToken)

  if (!claims) {
    return null
  }

  const nowSeconds = Math.floor(Date.now() / 1000)

  return {
    jti: claims.jti ?? '<no jti>',
    userId: claims.user_id ?? null,
    org: claims.org ?? null,
    type: claims.type ?? null,
    impersonatorId: claims.impersonator_id ?? null,
    sessionId: claims.session_id ?? null,
    ageSeconds: claims.iat ? nowSeconds - claims.iat : null,
    expiresInSeconds: claims.exp ? claims.exp - nowSeconds : null,
    expired: isClaimExpired(claims),
  }
}

export const sameToken = (a: string | undefined | null, b: string | undefined | null): boolean => !!a && !!b && a === b
