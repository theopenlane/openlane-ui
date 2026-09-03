'use client'

// Never refresh from the server: core sends the renewed session cookie as a Set-Cookie, so a
// server-side call drops it. That was #2238. 'use client' alone only blows up at runtime,
// 'client-only' fails the build.
import 'client-only'

import { openlaneAPIUrl } from '@repo/dally/auth'
import { secureFetch } from './secure-fetch'
import { parseRetryAfter } from './retry-after'
import { readSSORequirement, type SSORequirement } from './sso-required'
import { getRefreshTokenReadyAt } from './session-tokens'

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export type RefreshResult =
  | { status: 'ok'; tokens: Tokens }
  | { status: 'rejected' }
  | { status: 'sso-required'; requirement: SSORequirement }
  | { status: 'unavailable'; retryAfterMs: number }
  | { status: 'not-ready'; readyAt: number }

/**
 * `rejected` is destructive: it ends in the session-expired modal, which
 * revokes the tokens and server session. So this is an allowlist — anything
 * unrecognised stays recoverable rather than logging a live user out.
 */
const REJECTED_REFRESH_STATUSES = new Set([400, 401])

export const fetchNewAccessToken = async (refreshToken: string): Promise<RefreshResult> => {
  const readyAt = getRefreshTokenReadyAt(refreshToken)

  if (readyAt !== null && Date.now() < readyAt) {
    return { status: 'not-ready', readyAt }
  }

  let response: Response

  try {
    response = await secureFetch(`${openlaneAPIUrl}/v1/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch (error) {
    console.error('Refresh token request failed:', error)
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(null) }
  }

  if (!response.ok) {
    console.error(`Failed to refresh access token. Status: ${response.status}`)

    const ssoRequirement = await readSSORequirement(response)

    if (ssoRequirement) {
      return { status: 'sso-required', requirement: ssoRequirement }
    }

    return REJECTED_REFRESH_STATUSES.has(response.status) ? { status: 'rejected' } : { status: 'unavailable', retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) }
  }

  try {
    const data: { access_token?: string; refresh_token?: string } = await response.json()

    // A 2xx with no access token is a malformed response, not proof the
    // credential is dead — stay recoverable.
    if (!data.access_token) {
      return { status: 'unavailable', retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) }
    }

    // Core does not necessarily rotate the refresh token; keep the one we sent
    // rather than storing undefined.
    return { status: 'ok', tokens: { accessToken: data.access_token, refreshToken: data.refresh_token || refreshToken } }
  } catch (error) {
    console.error('Refresh token response was not valid JSON:', error)
    return { status: 'unavailable', retryAfterMs: parseRetryAfter(null) }
  }
}
