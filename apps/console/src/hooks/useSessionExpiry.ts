'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'
import { probeSession } from '@/lib/auth/utils/session-health'
import { getIsSessionInvalid, notifySessionExpired, SESSION_EXPIRED_EVENT } from '@/lib/auth/utils/session-status'
import { useSessionResync } from '@/lib/graphqlClient'

const MAX_TIMEOUT_MS = 2_147_483_647

const refreshExpiresAt = (refreshToken?: string | null): number => {
  if (!refreshToken) {
    return 0
  }

  try {
    const { exp } = jwtDecode<{ exp?: number }>(refreshToken)

    return exp ? exp * 1000 : Number.POSITIVE_INFINITY
  } catch {
    return 0
  }
}

// useSessionExpiry surfaces the expired-session modal once the server no longer honours the session
export function useSessionExpiry() {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(getIsSessionInvalid)
  const { data: sessionData } = useSession()
  const resyncSession = useSessionResync()
  const refreshToken = sessionData?.user?.refreshToken

  const checkSession = useCallback(async () => {
    const probe = await probeSession({ maxAgeMs: 0 })

    switch (probe.status) {
      case 'available':
        void resyncSession()
        break
      case 'signed-out':
        notifySessionExpired()
        break
      default:
    }
  }, [resyncSession])

  useEffect(() => {
    const handler = () => setShowSessionExpiredModal(true)
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && Date.now() >= refreshExpiresAt(refreshToken)) {
        void checkSession()
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [refreshToken, checkSession])

  useEffect(() => {
    if (!refreshToken) return

    const delay = Math.min(refreshExpiresAt(refreshToken) - Date.now(), MAX_TIMEOUT_MS)
    const expireTimeoutId = window.setTimeout(() => void checkSession(), Math.max(0, delay))

    return () => window.clearTimeout(expireTimeoutId)
  }, [refreshToken, checkSession])

  return { showSessionExpiredModal }
}
