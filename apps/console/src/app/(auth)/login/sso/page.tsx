'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { getCookie } from '@/lib/auth/utils/getCookie'

const ORG_SETTINGS_URL = '/organization-settings/authentication'
const LOGIN_URL = '/login'

const SSOCallbackPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getRedirectUrl = (error?: string, isSuccess = false) => {
    const isTesting = localStorage.getItem('testing_sso')
    const apiTokenData = localStorage.getItem('api_token')

    if (isTesting) {
      if (isSuccess) return `${ORG_SETTINGS_URL}?ssotested=1`
      return `${ORG_SETTINGS_URL}?ssotested=0&error=${error}`
    }

    if (apiTokenData) {
      const tokenInfo = JSON.parse(apiTokenData)
      const basePath = tokenInfo.isOrg ? '/organization-settings/developers' : '/user-settings/developers'
      if (isSuccess) return `${basePath}?token_authorized=1`
      return `${basePath}?error=${error}`
    }

    if (isSuccess) return '/'
    return `${LOGIN_URL}?error=${error}`
  }

  useEffect(() => {
    const handleSSOCallback = async () => {
      try {
        const state = searchParams?.get('state')
        const code = searchParams?.get('code')

        if (!code || !state) {
          console.error('Missing required OAuth parameters')
          router.push(getRedirectUrl('missing_oauth_params'))
          return
        }

        // check cookie or localstorage for the org id
        const organizationId = getCookie('organization_id')
        console.log(organizationId)

        if (!organizationId) {
          router.push(getRedirectUrl('missing_organization_id'))
          return
        }

        const response = await fetch('/api/auth/sso/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            organization_id: organizationId,
          }),
          credentials: 'include',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          const signInResult = await signIn('credentials', {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            session: data.session,
            redirect: false,
            type: 'oidc',
          })

          if (signInResult && !signInResult.error) {
            const redirectUrl = data.redirect_url || getRedirectUrl(undefined, true)
            router.push(redirectUrl)
            return
          }

          router.push(getRedirectUrl('sso_signin_failed'))
        } else {
          console.error('SSO callback failed:', data)
          router.push(getRedirectUrl('sso_callback_failed'))
        }
      } catch (error) {
        console.error('SSO callback error:', error)
        router.push(getRedirectUrl('sso_callback_error'))
      } finally {
        localStorage.removeItem('testing_sso')
        localStorage.removeItem('api_token')
      }
    }

    handleSSOCallback()
  }, [router, searchParams])

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing SSO authentication...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  )
}

export default SSOCallbackPage
