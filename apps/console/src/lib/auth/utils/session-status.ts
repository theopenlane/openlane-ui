'use client'

import { clearTokens } from './session-tokens'
import { resetSessionProbe } from './session-health'
import { readSSORequirement, type SSORequirement } from './sso-required'

export const SESSION_EXPIRED_EVENT = 'session-expired'
export const SSO_REAUTH_REQUIRED_EVENT = 'sso-reauth-required'

let isSessionInvalid = false
let ssoRequirement: SSORequirement | null = null

export const getIsSessionInvalid = () => isSessionInvalid

// Both flags latch for the life of the module, which is right for the app but untestable.
export const resetSessionStatus = () => {
  isSessionInvalid = false
  ssoRequirement = null
}

export const markSessionExpired = () => {
  isSessionInvalid = true
  ssoRequirement = null
  clearTokens()
  resetSessionProbe()
}

export const notifySessionExpired = () => {
  if (isSessionInvalid) return
  markSessionExpired()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export const getSSORequirement = () => ssoRequirement

export const notifySSOReauthRequired = (requirement: SSORequirement) => {
  if (ssoRequirement) return
  ssoRequirement = requirement
  window.dispatchEvent(new Event(SSO_REAUTH_REQUIRED_EVENT))
}

export const clearSSOReauthRequired = () => {
  if (!ssoRequirement) return
  ssoRequirement = null
  window.dispatchEvent(new Event(SSO_REAUTH_REQUIRED_EVENT))
}

export const reportSSORequirementFromResponse = async (response: Response): Promise<boolean> => {
  const requirement = await readSSORequirement(response)

  if (!requirement) {
    return false
  }

  notifySSOReauthRequired(requirement)

  return true
}
