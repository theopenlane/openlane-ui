'use client'

import { resolveCurrentTokens } from './session-refresh'
import { getIsSessionInvalid } from './session-status'
import { getTokenGeneration } from './session-tokens'
import { noteAuthorizedResponse, recoverUnauthorized } from './unauthorized-recovery'

/**
 * fetch for our own /api routes, with the same 401 recovery the GraphQL transports use.
 * These handlers read the token from the server session via auth(), not from a header, so
 * the credential that has to move is the NextAuth session — a browser refresh writes its
 * new pair back there, which is why gating the retry on our own token changing works.
 *
 * Nothing is resolved until a 401 actually happens; the happy path is a plain fetch.
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const send = async () => await fetch(input, { credentials: 'include', ...init })
  const response = await send()

  if (response.status !== 401) {
    noteAuthorizedResponse()
    return response
  }

  if (getIsSessionInvalid()) {
    return response
  }

  try {
    const generation = getTokenGeneration()
    const tokens = await resolveCurrentTokens()

    // Resolving may itself have refreshed a due pair, so this 401 predates it — retry first.
    const retried = generation === getTokenGeneration() ? response : await send()

    return retried.status === 401 ? await recoverUnauthorized(retried, tokens, send) : retried
  } catch (error) {
    // No credential at all. Callers branch on res.ok, so hand back the 401 instead of throwing.
    console.error('❌ Could not resolve a credential to retry an unauthorized request:', error)
    return response
  }
}
