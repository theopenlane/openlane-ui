'use client'

import { resolveCurrentTokens } from './session-refresh'
import { getIsSessionInvalid } from './session-status'
import { getTokenGeneration } from './session-tokens'
import { noteAuthorizedResponse, recoverUnauthorized } from './unauthorized-recovery'

// fetch for our own /api routes. They read the token from the server session via auth(), not
// from a header, so there's nothing to put on the request — what has to move is the NextAuth
// session, and a browser refresh writes its new pair back there. Nothing is resolved until a
// 401 actually happens; resolving up front would put a probe and a possible logout in front of
// every call, including ones made while a session is still being set up.
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

    // Resolving may have refreshed a due pair, so this 401 predates it. Retry before giving up.
    const retried = generation === getTokenGeneration() ? response : await send()

    return retried.status === 401 ? await recoverUnauthorized(retried, tokens, send) : retried
  } catch (error) {
    // No credential at all. Callers check res.ok, so don't turn this into a throwing API.
    console.error('❌ Could not resolve a credential to retry an unauthorized request:', error)
    return response
  }
}
