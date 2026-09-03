'use client'

import { resolveCurrentTokens } from './session-refresh'
import { getIsSessionInvalid } from './session-status'
import { getTokenGeneration, getUsableTokens, type TokenState } from './session-tokens'
import { describeToken } from './token-claims'
import { noteAuthorizedResponse, recoverUnauthorized } from './unauthorized-recovery'

const isOwnApiRoute = (input: RequestInfo | URL): boolean => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  if (url.startsWith('/api/')) {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const parsed = new URL(url, window.location.origin)

    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')
  } catch {
    return false
  }
}

// fetch for our own /api routes. Attaches the tab's token as a bearer, since the routes prefer
// it over the cookie copy that can lag behind. A caller's own Authorization is left alone.
// Nothing is probed or refreshed until a 401, the happy path is one fetch.
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const attachBearer = isOwnApiRoute(input) && !new Headers(init?.headers).has('authorization')

  const send = async (tokens: TokenState | null) => {
    const headers = new Headers(init?.headers)

    if (attachBearer && tokens) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`)
    }

    return await fetch(input, { credentials: 'include', ...init, headers })
  }

  const initial = getUsableTokens()
  const response = await send(initial)

  if (response.status !== 401) {
    noteAuthorizedResponse()
    return response
  }

  console.warn('⚠️ /api request came back 401', { at: new Date().toISOString(), url: String(input), sentBearer: attachBearer && !!initial, bearer: describeToken(initial?.accessToken) })

  if (getIsSessionInvalid()) {
    return response
  }

  try {
    const generation = getTokenGeneration()
    const tokens = await resolveCurrentTokens()

    // Resolving may have refreshed a due pair, so retry before giving up.
    const retried = generation === getTokenGeneration() ? response : await send(tokens)

    return retried.status === 401 ? await recoverUnauthorized(retried, tokens, send) : retried
  } catch (error) {
    // No credential at all. Callers check res.ok, so return the 401 rather than throw.
    console.error('❌ Could not resolve a credential to retry an unauthorized request:', error)
    return response
  }
}
