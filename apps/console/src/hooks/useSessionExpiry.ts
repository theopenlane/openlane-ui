'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { probeSession } from '@/lib/auth/utils/session-health'
import { clearSessionExpired, getIsSessionInvalid, notifySessionExpired, SESSION_EXPIRED_EVENT } from '@/lib/auth/utils/session-status'
import { tokenExpiresAt } from '@/lib/auth/utils/token-claims'
import { useSessionResync } from '@/lib/graphqlClient'
import { describeToken, logSessionEvent } from '@/lib/auth/utils/session-log'
import { reportSessionEvent } from '@/lib/auth/utils/session-event'

const MAX_TIMEOUT_MS = 2_147_483_647

const hasExpired = (expiresAt: number | null): boolean => expiresAt === null || Date.now() >= expiresAt

const scheduleAt = (deadline: number, run: () => void): (() => void) => {
  let timeoutId = 0

  const armNextChunk = () => {
    const remaining = deadline - Date.now()
    timeoutId = window.setTimeout(remaining > MAX_TIMEOUT_MS ? armNextChunk : run, Math.max(0, Math.min(remaining, MAX_TIMEOUT_MS)))
  }

  armNextChunk()

  return () => window.clearTimeout(timeoutId)
}

// useSessionExpiry surfaces the expired-session modal once the server no longer honours the session
export const useSessionExpiry = () => {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const { data: sessionData } = useSession()
  const resyncSession = useSessionResync()
  const refreshToken = sessionData?.user?.refreshToken
  const [nextCheckAt, setNextCheckAt] = useState<number | null>(null)
  const isDoubleCheckingRef = useRef(false)
  const accessTokenRef = useRef(sessionData?.user?.accessToken)

  useEffect(() => {
    accessTokenRef.current = sessionData?.user?.accessToken
  }, [sessionData?.user?.accessToken])

  const doubleCheckExpiry = useCallback(async () => {
    if (isDoubleCheckingRef.current) return
    isDoubleCheckingRef.current = true

    try {
      const probe = await probeSession({ notBefore: Date.now() })

      switch (probe.status) {
        case 'signed-out':
          reportSessionEvent({ verdict: 'expiry-confirmed', access: describeToken(accessTokenRef.current) })
          setShowSessionExpiredModal(true)
          break
        case 'available':
          logSessionEvent('warn', 'expiry was a false alarm, session is still valid', {
            access: describeToken(accessTokenRef.current),
          })
          reportSessionEvent({ verdict: 'false-alarm', access: describeToken(accessTokenRef.current) })
          clearSessionExpired()
          void resyncSession()
          break
        default:
          clearSessionExpired()
          setNextCheckAt(Date.now() + probe.retryAfterMs)
      }
    } finally {
      isDoubleCheckingRef.current = false
    }
  }, [resyncSession])

  const checkSession = useCallback(async () => {
    const probe = await probeSession({ maxAgeMs: 0 })

    switch (probe.status) {
      case 'available': {
        void resyncSession()

        const serverExpiry = tokenExpiresAt(probe.session.user?.refreshToken)

        setNextCheckAt(serverExpiry !== null && Number.isFinite(serverExpiry) && serverExpiry > Date.now() ? serverExpiry : null)
        break
      }
      case 'signed-out':
        setNextCheckAt(null)
        notifySessionExpired()
        break
      default:
        setNextCheckAt(Date.now() + probe.retryAfterMs)
    }
  }, [resyncSession])

  useEffect(() => {
    if (getIsSessionInvalid()) {
      void doubleCheckExpiry()
    }

    const handler = () => void doubleCheckExpiry()
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }, [doubleCheckExpiry])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && hasExpired(tokenExpiresAt(refreshToken))) {
        void checkSession()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [refreshToken, checkSession])

  useEffect(() => {
    if (!refreshToken) return

    const expiresAt = tokenExpiresAt(refreshToken)

    if (expiresAt === Number.POSITIVE_INFINITY) {
      return
    }

    return scheduleAt(expiresAt ?? Date.now(), () => void checkSession())
  }, [refreshToken, checkSession])

  useEffect(() => {
    setNextCheckAt(null)
  }, [refreshToken])

  useEffect(() => {
    if (nextCheckAt === null) return

    return scheduleAt(nextCheckAt, () => void checkSession())
  }, [nextCheckAt, checkSession])

  return { showSessionExpiredModal }
}
