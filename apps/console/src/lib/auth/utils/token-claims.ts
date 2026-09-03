import { jwtDecode } from 'jwt-decode'

interface AccessTokenClaims {
  jti?: string
  exp?: number
  iat?: number
  user_id?: string
  org?: string
}

export interface TokenDescription {
  jti: string
  userId: string | null
  org: string | null
  ageSeconds: number | null
  expiresInSeconds: number | null
  expired: boolean
}

// Everything here is safe to log. jti identifies a token without being usable as one, so a
// stale-credential bug is readable from logs without ever printing a token.
export const describeToken = (accessToken: string | undefined | null): TokenDescription | null => {
  if (!accessToken) {
    return null
  }

  try {
    const { jti, exp, iat, user_id: userId, org } = jwtDecode<AccessTokenClaims>(accessToken)
    const nowSeconds = Math.floor(Date.now() / 1000)

    return {
      jti: jti ?? '<no jti>',
      userId: userId ?? null,
      org: org ?? null,
      ageSeconds: iat ? nowSeconds - iat : null,
      expiresInSeconds: exp ? exp - nowSeconds : null,
      expired: !!exp && nowSeconds >= exp,
    }
  } catch {
    return null
  }
}

export const sameToken = (a: string | undefined | null, b: string | undefined | null): boolean => !!a && !!b && a === b
