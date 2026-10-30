'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { getOrganizationByID, currentOrgId } = useOrganization()

  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isPlugReady, setIsPlugReady] = useState(false)
  const lastInitRef = useRef<string | null>(null) // new

  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const orgName = currentOrganization?.node?.name
  const orgDisplayName = currentOrganization?.node?.displayName

  useEffect(() => {
    const fetchSessionToken = async () => {
      if (status !== 'authenticated' || !session || !orgName || !orgDisplayName || !currentOrgId) {
        return
      }

      try {
        const res = await fetch(`/api/devrev-token?orgId=${currentOrgId}&orgName=${orgName}&orgDisplayName=${orgDisplayName}`)
        const data = await res.json()
        if (res.ok && data?.session_token) {
          setSessionToken(data.session_token)
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
    if (!isPlugReady || !sessionToken || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function') {
      return
    }

    const currentInitKey = `${sessionToken}:${currentOrgId}`
    if (lastInitRef.current === currentInitKey) return

    if (window.plugSDK.__plug_initialized__) {
      window.plugSDK.shutdown()
    }

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      session_token: sessionToken,
    })

    window.plugSDK.__plug_initialized__ = true
    lastInitRef.current = currentInitKey
  }, [isPlugReady, sessionToken, resolvedTheme, currentOrgId])

  return <Script src="https://plug-platform.devrev.ai/static/plug.js" onReady={() => setIsPlugReady(true)} />
}
