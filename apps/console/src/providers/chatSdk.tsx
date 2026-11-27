'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'
import { setPlugWidgetReady } from '@/hooks/usePlugSupportWidget'

const PLUG_WIDGET_READY_EVENT = 'ON_PLUG_WIDGET_READY'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { getOrganizationByID, currentOrgId } = useOrganization()

  const [plugToken, setPlugToken] = useState<{ token: string; orgId: string } | null>(null)
  const [isPlugReady, setIsPlugReady] = useState(false)
  const lastInitRef = useRef<string | null>(null)
  const pendingShutdownRef = useRef<Promise<void> | null>(null)

  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const orgName = currentOrganization?.node?.name
  const orgDisplayName = currentOrganization?.node?.displayName

  useEffect(() => {
    const fetchSessionToken = async () => {
      if (status !== 'authenticated' || !session || !orgName || !orgDisplayName || !currentOrgId) {
        return
      }
      const orgId = currentOrgId

      try {
        const res = await fetch(`/api/devrev-token?orgId=${currentOrgId}&orgName=${orgName}&orgDisplayName=${orgDisplayName}`)
        const data = await res.json()
        if (res.ok && data?.session_token) {
          setPlugToken({ token: data.session_token, orgId })
        } else {
          console.error('DevRev token error:', data.error)
        }
      } catch (err) {
        console.error('Failed to fetch DevRev token:', err)
      }
    }

    fetchSessionToken()
  }, [status, session, currentOrgId, orgName, orgDisplayName])

  useEffect(() => {
    if (!isPlugReady || !plugToken || plugToken.orgId !== currentOrgId || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function') {
      return
    }

    const plug = window.plugSDK
    const appId = chatAppId
    const sessionToken = plugToken.token
    const currentInitKey = `${sessionToken}:${plugToken.orgId}`
    if (lastInitRef.current === currentInitKey) return
    lastInitRef.current = currentInitKey

    let cancelled = false
    let initialized = false

    const initialize = async () => {
      if (plug.__plug_initialized__) {
        setPlugWidgetReady(false)
        plug.__plug_initialized__ = false
        pendingShutdownRef.current = Promise.resolve(plug.shutdown())
      }
      await pendingShutdownRef.current
      if (cancelled) return

      plug.init({
        app_id: appId,
        theme: resolvedTheme,
        session_token: sessionToken,
      })
      plug.__plug_initialized__ = true
      initialized = true

      plug.onEvent?.((payload) => {
        if (payload.type === PLUG_WIDGET_READY_EVENT) setPlugWidgetReady(true)
      })
    }

    initialize().catch((err) => console.error('Failed to initialize DevRev chat:', err))

    return () => {
      cancelled = true
      if (!initialized && lastInitRef.current === currentInitKey) lastInitRef.current = null
    }
  }, [isPlugReady, plugToken, resolvedTheme, currentOrgId])

  useEffect(
    () => () => {
      lastInitRef.current = null
      setPlugWidgetReady(false)
    },
    [],
  )

  return <Script src="https://plug-platform.devrev.ai/static/plug.js" onReady={() => setIsPlugReady(true)} />
}
