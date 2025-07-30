'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { getOrganizationByID, currentOrgId } = useOrganization()
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const orgName = currentOrganization?.node?.name
  const orgDisplayName = currentOrganization?.node?.displayName

  useEffect(() => {
    const fetchSessionToken = async () => {
      if (!session || !orgName || !orgDisplayName) return

      const res = await fetch(`/api/devrev-token?orgId=${currentOrgId}&orgName=${orgName}&orgDisplayName=${orgDisplayName}`)
      const data = await res.json()
      if (res.ok) {
        setSessionToken(data.session_token)
      } else {
        console.error('DevRev token error:', data.error)
      }
    }

    if (status === 'authenticated') {
      fetchSessionToken()
    }
  }, [status, session, currentOrgId, orgName, orgDisplayName])

  useEffect(() => {
    if (!sessionToken || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function' || window.plugSDK.__plug_initialized__) {
      return
    }

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      identity: {
        session_token: sessionToken,
      },
    })
    window.plugSDK.__plug_initialized__ = true
  }, [sessionToken, resolvedTheme])

  return null
}
