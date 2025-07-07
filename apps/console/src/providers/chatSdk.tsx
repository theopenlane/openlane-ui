'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { chatAppId } from '@repo/dally/auth'

export const InitPlugSDK = () => {
  if (!chatAppId) return null

  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !mounted || !resolvedTheme) return

    window.plugSDK?.init({
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
  }, [mounted, status, session, resolvedTheme])

  return null
}
