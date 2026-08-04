'use client'

import { clearTokens } from './session-tokens'
import { resetSessionProbe } from './session-health'

export const SESSION_EXPIRED_EVENT = 'session-expired'

let isSessionInvalid = false

export const getIsSessionInvalid = () => isSessionInvalid

export const markSessionExpired = () => {
  isSessionInvalid = true
  clearTokens()
  resetSessionProbe()
}

export const notifySessionExpired = () => {
  if (isSessionInvalid) return
  markSessionExpired()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}
