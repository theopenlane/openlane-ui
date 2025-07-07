'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'

export const InitPlugSDK = () => {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !resolvedTheme || !chatAppId || typeof window === 'undefined' || typeof window.plugSDK?.init !== 'function' || window.plugSDK.__plug_initialized__) {
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
          custom_fields: {},
        },
      },
    })
    window.plugSDK.__plug_initialized__ = true
  }, [status, resolvedTheme, session])

  return null
}
