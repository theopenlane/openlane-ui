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

let inFlightProbe: { promise: Promise<SessionProbeResult>; generation: number; startedAt: number } | null = null
let cachedProbe: { result: SessionProbeResult; expiresAt: number } | null = null
let probeGeneration = 0
let probeSequence = 0
let latestSettledSequence = 0

const runProbe = async (): Promise<SessionProbeResult> => {
  let response: Response

  try {
    response = await fetch(SESSION_ENDPOINT, { credentials: 'include', headers: { accept: 'application/json' } })
  } catch {
    return { status: 'unavailable', retryAfterMs: DEFAULT_RETRY_MS }
  }

  // Any non-OK response is an infrastructure answer, not evidence about the
  // session — treating it as signed-out fed the destructive expiry path. A real
  // signed-out session is a 200 whose body carries no access token (below).
  if (!response.ok) {
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) }
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
  probeGeneration += 1
}

export const probeSession = async ({ maxAgeMs = PROBE_CACHE_MS, notBefore }: { maxAgeMs?: number; notBefore?: number } = {}): Promise<SessionProbeResult> => {
  if (notBefore === undefined && maxAgeMs > 0 && cachedProbe && Date.now() < cachedProbe.expiresAt) {
    return cachedProbe.result
  }

  const startedGeneration = probeGeneration
  const current = inFlightProbe

  if (current && current.generation === startedGeneration && (notBefore === undefined || current.startedAt >= notBefore)) {
    return current.promise
  }

  const startedSequence = ++probeSequence

  const promise = runProbe()
    .then((result) => {
      if (probeGeneration === startedGeneration && startedSequence > latestSettledSequence) {
        latestSettledSequence = startedSequence
        cachedProbe = { result, expiresAt: Date.now() + PROBE_CACHE_MS }
      }

      return result
    })
    .finally(() => {
      if (inFlightProbe?.promise === promise) {
        inFlightProbe = null
      }
    })

  inFlightProbe = { promise, generation: startedGeneration, startedAt: Date.now() }

  return promise
}
