'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'
import { refreshTokens } from '@/lib/auth/utils/session-refresh'
import { SessionUnavailableError } from '@/lib/auth/utils/session-health'
import { getIsSessionInvalid } from '@/lib/auth/utils/session-status'
import { REFRESH_TOKEN_SKEW_MARGIN_MS } from '@/lib/auth/utils/session-tokens'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['keydown', 'mousemove', 'click', 'scroll', 'touchstart']
const ACTIVITY_RETRY_BACKOFF_MS = 30_000
const ACTIVITY_MIN_INTERVAL_MS = 60_000

interface RefreshTokenClaims {
  nbf?: number
  exp?: number
}

export function useSessionExpiry() {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(getIsSessionInvalid)
  const { data: sessionData } = useSession()

  useEffect(() => {
    const handler = () => setShowSessionExpiredModal(true)
    window.addEventListener('session-expired', handler)
    return () => window.removeEventListener('session-expired', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== 'visible') return
      const token = sessionData?.user?.refreshToken
      if (!token) return
      try {
        const { exp } = jwtDecode<RefreshTokenClaims>(token)
        if (exp && Date.now() >= exp * 1000) setShowSessionExpiredModal(true)
      } catch {
        setShowSessionExpiredModal(true)
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [sessionData])

  useEffect(() => {
    const token = sessionData?.user?.refreshToken
    if (!token) return

    let claims: RefreshTokenClaims
    try {
      claims = jwtDecode<RefreshTokenClaims>(token)
    } catch {
      setShowSessionExpiredModal(true)
      return
    }
    if (!claims.exp) return

    const now = Date.now()
    const nbfMs = (claims.nbf ?? 0) * 1000
    const expMs = claims.exp * 1000

    if (now >= expMs) {
      setShowSessionExpiredModal(true)
      return
    }

    let armed = false
    let inFlight = false
    let nextAttemptAt = 0

    const onActivity = async () => {
      if (!armed || inFlight || Date.now() < nextAttemptAt) return
      inFlight = true
      try {
        await refreshTokens(token)
      } catch (error) {
        nextAttemptAt = Date.now() + (error instanceof SessionUnavailableError ? error.retryAfterMs : ACTIVITY_RETRY_BACKOFF_MS)
      } finally {
        inFlight = false
        nextAttemptAt = Math.max(nextAttemptAt, Date.now() + ACTIVITY_MIN_INTERVAL_MS)
      }
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const armTimeoutId = window.setTimeout(
      () => {
        armed = true
      },
      Math.max(0, nbfMs + REFRESH_TOKEN_SKEW_MARGIN_MS - now),
    )
    const expireTimeoutId = window.setTimeout(() => setShowSessionExpiredModal(true), expMs - now)

    return () => {
      window.clearTimeout(armTimeoutId)
      window.clearTimeout(expireTimeoutId)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    }
  }, [sessionData])

  return { showSessionExpiredModal }
}
