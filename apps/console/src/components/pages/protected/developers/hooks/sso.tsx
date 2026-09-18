'use client'

import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { startSsoRedirect, type SsoTokenType } from '@/lib/auth/utils/sso-intent'

type UseSSOAuthorizeProps = {
  isApiKeyPage: boolean
  isEditMode: boolean
  editTokenId?: string
  createdTokenId: string
}

export const useSSOAuthorize = ({ isApiKeyPage, isEditMode, editTokenId, createdTokenId }: UseSSOAuthorizeProps) => {
  const [isAuthorizingSSO, setIsAuthorizingSSO] = useState(false)
  const { currentOrgId } = useOrganization()
  const { errorNotification } = useNotification()

  const tokenType: SsoTokenType = isApiKeyPage ? 'api' : 'personal'
  const tokenIdForSSO = isEditMode && editTokenId ? editTokenId : createdTokenId

  const handleSSOAuthorize = async (orgId?: string) => {
    try {
      setIsAuthorizingSSO(true)
      const response = await fetch('/api/auth/sso/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organization_id: orgId ?? currentOrgId, token_id: tokenIdForSSO, token_type: tokenType }),
      })
      const data = await response.json()
      if (response.ok && data.success && data.redirect_uri) {
        if (!startSsoRedirect(data.redirect_uri, tokenType)) {
          throw new Error('Enable browser storage for this site so we can return you here after authorizing the token')
        }
      } else {
        throw new Error(data.error || 'SSO authorization failed')
      }
    } catch (error) {
      console.error('SSO authorization error:', error)
      errorNotification({
        title: 'SSO Authorization Failed',
        description: error instanceof Error ? error.message : 'An error occurred during SSO authorization',
      })
    } finally {
      setIsAuthorizingSSO(false)
    }
  }

  return { handleSSOAuthorize, isAuthorizingSSO }
}
