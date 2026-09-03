'use client'

import { recoverTokensAfterUnauthorized } from './session-refresh'
import { getIsSessionInvalid, notifySessionExpired, reportSSORequirementFromResponse } from './session-status'
import type { TokenState } from './session-tokens'

/**
 * Shared 401 policy for every authenticated transport. Retrying a 401 with the same
 * credential just reproduces it, so every retry needs a credential that actually changed:
 * adopt one another request installed, refresh if due, else force a refresh (the only way
 * to reinstall the Openlane session cookie).
 *
 * The per-request budget only bounds the loop; it never ends the session. Core's `nbf` means
 * one request can't mint five credentials on its own, so that count is reached by concurrent
 * churn — other requests succeeding — which is the opposite of a dead session.
 *
 * Being stuck is a property of the tab, not of one request, so that is what UNRECOVERABLE_
 * STREAK measures: requests that exhausted the ladder with no successful response in between.
 * If anything is succeeding the streak resets, which is what separates a permission-shaped
 * 401 on one resource, or token churn, from a session that can no longer authenticate
 * anything. The remaining case is refreshes that keep succeeding while every request is
 * still rejected; nothing else detects that, and it leaves the user on a dead page forever.
 */
export const MAX_CREDENTIAL_RETRIES = 5

const UNRECOVERABLE_STREAK = 5

let unrecoverableStreak = 0

/** Any response the session could authenticate proves the tab is not stuck. */
export const noteAuthorizedResponse = () => {
  unrecoverableStreak = 0
}

const noteUnrecoverableUnauthorized = () => {
  unrecoverableStreak += 1

  if (unrecoverableStreak >= UNRECOVERABLE_STREAK && !getIsSessionInvalid()) {
    console.error(`❌ ${unrecoverableStreak} requests failed to authenticate with nothing succeeding in between — ending the session`)
    notifySessionExpired()
  }
}

type SendRequest = (tokens: TokenState) => Promise<Response>

const nextCredential = async (failed: TokenState): Promise<TokenState | null> => {
  return (await recoverTokensAfterUnauthorized(failed)) ?? (await recoverTokensAfterUnauthorized(failed, { forceRefresh: true }))
}

/** Recovery loop over an already-401 response, so api-fetch can send first and resolve later. */
export const recoverUnauthorized = async (unauthorized: Response, initial: TokenState, send: SendRequest): Promise<Response> => {
  let tokens = initial
  let response = unauthorized
  let credentialChanges = 0

  while (response.status === 401 && !getIsSessionInvalid() && credentialChanges < MAX_CREDENTIAL_RETRIES) {
    // SSO re-auth has its own UI; no fresh token satisfies it, and it is not a stuck session.
    if (await reportSSORequirementFromResponse(response)) {
      return response
    }

    const recovered = await nextCredential(tokens)

    // Nothing new to send, so a retry would just reproduce this 401.
    if (!recovered || recovered.accessToken === tokens.accessToken) {
      break
    }

    tokens = recovered
    credentialChanges += 1

    // A concurrent expiry may have landed while we were recovering.
    if (getIsSessionInvalid()) {
      return response
    }

    response = await send(tokens)
  }

  if (response.status === 401) {
    noteUnrecoverableUnauthorized()
  } else {
    noteAuthorizedResponse()
  }

  return response
}

export const sendWithUnauthorizedRecovery = async (initial: TokenState, send: SendRequest): Promise<Response> => {
  const response = await send(initial)

  if (response.status !== 401) {
    noteAuthorizedResponse()
    return response
  }

  return await recoverUnauthorized(response, initial, send)
}
