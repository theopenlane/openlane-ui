'use client'

import type { Session } from 'next-auth'
import { parseRetryAfter } from './retry-after'

const SESSION_ENDPOINT = '/api/auth/session'
// Fallback for the two failures with no response headers to read — fetch threw (offline, DNS,
// CORS) or the body was not JSON. Mirrors DEFAULT_RETRY_MS in retry-after.ts; prefer calling
// parseRetryAfter(null) here so the number lives in one place.
const DEFAULT_RETRY_MS = 5_000
// How long a settled probe stays fresh. With inFlightProbe (which collapses concurrent callers
// into one request) this turns a mount burst of N queries into a single /api/auth/session call.
// Kept short because it is a cache of live auth state; the events that invalidate it
// (markSessionExpired, refresh) call resetSessionProbe rather than waiting out the TTL.
const PROBE_CACHE_MS = 2_000

export type SessionProbeResult = { status: 'available'; session: Session } | { status: 'signed-out' } | { status: 'unavailable'; retryAfterMs: number }

export class SessionUnavailableError extends Error {
  readonly retryAfterMs: number

  constructor(retryAfterMs: number) {
    super('Session could not be verified')
    this.name = 'SessionUnavailableError'
    this.retryAfterMs = retryAfterMs
  }
}

let inFlightProbe: Promise<SessionProbeResult> | null = null
let cachedProbe: { result: SessionProbeResult; expiresAt: number } | null = null

const runProbe = async (): Promise<SessionProbeResult> => {
  let response: Response

  try {
    response = await fetch(SESSION_ENDPOINT, { credentials: 'include', headers: { accept: 'application/json' } })
  } catch {
    return { status: 'unavailable', retryAfterMs: DEFAULT_RETRY_MS }
  }

  if (response.status === 429 || response.status >= 500) {
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) }
  }

  if (!response.ok) {
    return { status: 'signed-out' }
  }

  try {
    const session: Session | null = await response.json()
    return session?.user?.accessToken ? { status: 'available', session } : { status: 'signed-out' }
  } catch {
    return { status: 'unavailable', retryAfterMs: DEFAULT_RETRY_MS }
  }
}

export const resetSessionProbe = () => {
  cachedProbe = null
}

export const probeSession = async ({ maxAgeMs = PROBE_CACHE_MS }: { maxAgeMs?: number } = {}): Promise<SessionProbeResult> => {
  if (maxAgeMs > 0 && cachedProbe && Date.now() < cachedProbe.expiresAt) {
    return cachedProbe.result
  }

  if (inFlightProbe) {
    return inFlightProbe
  }

  inFlightProbe = runProbe()
    .then((result) => {
      cachedProbe = { result, expiresAt: Date.now() + PROBE_CACHE_MS }
      return result
    })
    .finally(() => {
      inFlightProbe = null
    })

  return inFlightProbe
}
