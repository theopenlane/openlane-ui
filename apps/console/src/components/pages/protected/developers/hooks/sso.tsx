'use client'

import { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'

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

  const tokenType = isApiKeyPage ? 'api' : 'personal'
  const tokenIdForSSO = isEditMode && editTokenId ? editTokenId : createdTokenId

  const handleSSOAuthorize = async (orgId?: string) => {
    try {
      setIsAuthorizingSSO(true)
      localStorage.setItem('api_token', JSON.stringify({ tokenType, isApiKeyPage }))
      const response = await fetch('/api/auth/sso/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organization_id: orgId ?? currentOrgId, token_id: tokenIdForSSO, token_type: tokenType }),
      })
      const data = await response.json()
      if (response.ok && data.success && data.redirect_uri) {
        window.location.assign(data.redirect_uri)
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
