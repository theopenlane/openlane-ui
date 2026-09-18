import { decodeTimeClaims } from './token-claims'

interface TokenDescription {
  jti: string | null
  expiresInSec: number | null
  expired: boolean | null
}

export const describeToken = (token?: string | null): TokenDescription => {
  if (!token) {
    return { jti: null, expiresInSec: null, expired: null }
  }

  const claims = decodeTimeClaims(token)

  if (!claims) {
    return { jti: null, expiresInSec: null, expired: null }
  }

  const expiresAt = claims.exp ? claims.exp * 1000 : null

  return {
    jti: claims.jti ?? null,
    expiresInSec: expiresAt === null ? null : Math.round((expiresAt - Date.now()) / 1000),
    expired: expiresAt === null ? null : Date.now() >= expiresAt,
  }
}

export const logSessionEvent = (level: 'warn' | 'error', event: string, detail: Record<string, unknown>) => {
  console[level](`[session] ${event}`, JSON.stringify(detail))
}
