'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'

type PlugSession = {
  organizationId: string
  token: string
}

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { currentOrgId } = useOrganization()

  const [plugSession, setPlugSession] = useState<PlugSession | null>(null)
  const lastInitRef = useRef<string | null>(null) // new

  useEffect(() => {
    const abortController = new AbortController()

    const fetchSessionToken = async () => {
      if (status !== 'authenticated' || !session || !currentOrgId) {
        setPlugSession(null)
        return
      }

      try {
        const res = await fetch('/api/devrev-token', { cache: 'no-store', signal: abortController.signal })
        const data = await res.json()
        if (res.ok && data?.session_token && data.organization_id === currentOrgId) {
          setPlugSession({ organizationId: data.organization_id, token: data.session_token })
        } else {
          console.error('DevRev token error:', data.error)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('Failed to fetch DevRev token:', err)
      }
    }

    setPlugSession(null)
    fetchSessionToken()

    return () => abortController.abort()
  }, [status, session, currentOrgId])

  useEffect(() => {
    if (!resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function') {
      return
    }

    if (!plugSession || plugSession.organizationId !== currentOrgId) {
      if (window.plugSDK.__plug_initialized__) {
        window.plugSDK.shutdown()
        window.plugSDK.__plug_initialized__ = false
        lastInitRef.current = null
      }
      return
    }

    const currentInitKey = `${plugSession.token}:${plugSession.organizationId}`
    if (lastInitRef.current === currentInitKey) return

    if (window.plugSDK.__plug_initialized__) {
      window.plugSDK.shutdown()
    }

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      session_token: plugSession.token,
    })

    window.plugSDK.__plug_initialized__ = true
    lastInitRef.current = currentInitKey
  }, [plugSession, resolvedTheme, currentOrgId])

  return null
}
