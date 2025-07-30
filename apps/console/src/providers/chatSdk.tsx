'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { getOrganizationByID, currentOrgId } = useOrganization()
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const hasFetchedToken = useRef(false)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const orgName = currentOrganization?.node?.name
  const orgDisplayName = currentOrganization?.node?.displayName

  useEffect(() => {
    const fetchSessionToken = async () => {
      if (hasFetchedToken.current || status !== 'authenticated' || !session || !orgName || !orgDisplayName || !currentOrgId) {
        return
      }

      try {
        hasFetchedToken.current = true
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
  }, [status, session, orgName, orgDisplayName, currentOrgId])

  useEffect(() => {
    if (!sessionToken || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function' || window.plugSDK.__plug_initialized__) {
      return
    }

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      session_token: sessionToken,
    })

    window.plugSDK.__plug_initialized__ = true
  }, [sessionToken, resolvedTheme])

  return null
}
