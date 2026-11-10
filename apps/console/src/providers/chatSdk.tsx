'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'
import { devRevTokenErrorSchema, devRevTokenResponseSchema } from '@/lib/devrev-token'

type TPlugSession = {
  organizationId: string
  token: string
}

const shutdownPlug = () => {
  if (window.plugSDK?.__plug_initialized__) {
    window.plugSDK.shutdown()
    window.plugSDK.__plug_initialized__ = false
  }
}

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { currentOrgId } = useOrganization()
  const userId = session?.user?.userId

  const [plugSession, setPlugSession] = useState<TPlugSession | null>(null)
  const [isPlugReady, setIsPlugReady] = useState(false)
  const lastInitRef = useRef<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !userId || !currentOrgId) {
      return
    }

    const abortController = new AbortController()

    const fetchSessionToken = async () => {
      try {
        const res = await fetch('/api/devrev-token', { cache: 'no-store', signal: abortController.signal })
        const body = await res.json()
        const data = devRevTokenResponseSchema.safeParse(body)

        if (!res.ok || !data.success) {
          const error = devRevTokenErrorSchema.safeParse(body)
          console.error('DevRev token error:', error.success ? error.data.error : res.status)
          return
        }

        if (data.data.organization_id !== currentOrgId) {
          console.error('DevRev token was issued for a different organization than the active one')
          return
        }

        setPlugSession({ organizationId: data.data.organization_id, token: data.data.session_token })
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch DevRev token:', err)
        }
      }
    }

    fetchSessionToken()

    return () => abortController.abort()
  }, [status, userId, currentOrgId])

  useEffect(() => {
    if (!isPlugReady || typeof window.plugSDK?.init !== 'function') {
      return
    }

    if (!plugSession || plugSession.organizationId !== currentOrgId) {
      shutdownPlug()
      lastInitRef.current = null
      return
    }

    if (!resolvedTheme || !chatAppId || lastInitRef.current === plugSession.token) {
      return
    }

    shutdownPlug()

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      session_token: plugSession.token,
    })

    window.plugSDK.__plug_initialized__ = true
    lastInitRef.current = plugSession.token
  }, [isPlugReady, plugSession, resolvedTheme, currentOrgId])

  return <Script src="https://plug-platform.devrev.ai/static/plug.js" onReady={() => setIsPlugReady(true)} />
}
