'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'
import { useOrganization } from '@/hooks/useOrganization'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const { getOrganizationByID, currentOrgId } = useOrganization()

  const currentOrganization = getOrganizationByID(currentOrgId!)
  const orgName = currentOrganization?.node?.displayName

  useEffect(() => {
    if (status !== 'authenticated' || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function' || window.plugSDK.__plug_initialized__ || !orgName) {
      return
    }

    window.plugSDK.init({
      app_id: chatAppId,
      theme: resolvedTheme,
      identity: {
        user_ref: session?.user?.name || 'Anonymous',
        user_traits: {
          display_name: session?.user?.name,
          email: session?.user?.email,
          custom_fields: { orgName, orgID: currentOrgId },
        },
      },
    })
    window.plugSDK.__plug_initialized__ = true
  }, [status, resolvedTheme, session, orgName, currentOrgId])

  return null
}
