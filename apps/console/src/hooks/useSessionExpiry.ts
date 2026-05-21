'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'
import { useSessionRefresh } from '@/lib/graphqlClient'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['keydown', 'mousemove', 'click', 'scroll', 'touchstart']

interface RefreshTokenClaims {
  nbf?: number
  exp?: number
}

export function useSessionExpiry() {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false)
  const { data: sessionData } = useSession()
  const refreshSession = useSessionRefresh()

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

    const onActivity = async () => {
      if (!armed || inFlight) return
      inFlight = true
      try {
        await refreshSession(token)
      } catch {
        inFlight = false
      }
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const armTimeoutId = window.setTimeout(
      () => {
        armed = true
      },
      Math.max(0, nbfMs - now),
    )
    const expireTimeoutId = window.setTimeout(() => setShowSessionExpiredModal(true), expMs - now)

    return () => {
      window.clearTimeout(armTimeoutId)
      window.clearTimeout(expireTimeoutId)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    }
  }, [sessionData, refreshSession])

  return { showSessionExpiredModal }
}
