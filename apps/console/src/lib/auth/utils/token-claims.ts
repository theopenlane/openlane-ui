import { jwtDecode } from 'jwt-decode'

export const CLOCK_SKEW_MS = 30_000

export const ACCESS_EXPIRY_MARGIN_MS = 10_000

export const ACCESS_REFRESH_FALLBACK_BUFFER_MS = 60_000

export interface TimeClaims {
  exp?: number
  nbf?: number
}

export const decodeTimeClaims = (token: string): TimeClaims | null => {
  try {
    return jwtDecode<TimeClaims>(token)
  } catch {
    return null
  }
}

export const tokenExpiresAt = (token?: string | null): number | null => {
  if (!token) {
    return null
  }

  const claims = decodeTimeClaims(token)

  if (!claims) {
    return null
  }

  return claims.exp ? claims.exp * 1000 : Number.POSITIVE_INFINITY
}

export const tokenUsableFrom = (token?: string | null): number | null => {
  if (!token) {
    return null
  }

  const claims = decodeTimeClaims(token)

  if (!claims) {
    return null
  }

  return claims.nbf ? claims.nbf * 1000 : null
}
