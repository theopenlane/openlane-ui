'use client'

import { recoverTokensAfterUnauthorized } from './session-refresh'
import { getIsSessionInvalid, notifySessionExpired, reportSSORequirementFromResponse } from './session-status'
import type { TokenState } from './session-tokens'

// Shared 401 policy for every transport. Retrying with the same credential just gives you the
// same 401, so a retry needs one that actually changed: take one another request installed,
// refresh if due, else force a refresh (the only way to reinstall the session cookie).
export const MAX_CREDENTIAL_RETRIES = 5

const UNRECOVERABLE_STREAK = 5

let unrecoverableStreak = 0

// Stuck is a property of the tab, not one request. Five failures in a row with nothing
// succeeding in between means the session really can't authenticate anything.
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

// Split out so api-fetch can send first and only resolve a credential once it needs one.
export const recoverUnauthorized = async (unauthorized: Response, initial: TokenState, send: SendRequest): Promise<Response> => {
  let tokens = initial
  let response = unauthorized
  let credentialChanges = 0

  while (response.status === 401 && !getIsSessionInvalid() && credentialChanges < MAX_CREDENTIAL_RETRIES) {
    // SSO re-auth has its own UI, and no fresh token satisfies it.
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
