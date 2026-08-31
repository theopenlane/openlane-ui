'use client'

import { useEffect, useState } from 'react'
import { getSSORequirement, SSO_REAUTH_REQUIRED_EVENT } from '@/lib/auth/utils/session-status'
import { type SSORequirement } from '@/lib/auth/utils/sso-required'

export const useSSOReauth = () => {
  const [ssoRequirement, setSSORequirement] = useState<SSORequirement | null>(getSSORequirement)

  useEffect(() => {
    const handler = () => setSSORequirement(getSSORequirement())

    window.addEventListener(SSO_REAUTH_REQUIRED_EVENT, handler)
    return () => window.removeEventListener(SSO_REAUTH_REQUIRED_EVENT, handler)
  }, [])

  return { ssoRequirement }
}
