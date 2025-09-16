'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

const ORG_SETTINGS_URL = '/organization-settings/authentication'
const LOGIN_URL = '/login'

const SSOCallbackPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSSOCallback = async () => {
      const isTesting = localStorage.getItem('testing_sso')
      const apiTokenData = localStorage.getItem('api_token')

      try {
        const state = searchParams?.get('state')
        const code = searchParams?.get('code')

        if (!code || !state) {
          console.error('Missing required OAuth parameters')
          let redirectUrl: string
          if (isTesting) {
            redirectUrl = `${ORG_SETTINGS_URL}?ssotested=0&error=missing_oauth_params`
          } else if (apiTokenData) {
            const tokenInfo = JSON.parse(apiTokenData)
            redirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?error=missing_oauth_params' : '/user-settings/developers?error=missing_oauth_params'
          } else {
            redirectUrl = `${LOGIN_URL}?error=missing_oauth_params`
          }
          router.push(redirectUrl)
          return
        }

        const organizationId = localStorage.getItem('sso_organization_id')

        if (!organizationId) {
          console.error('No organization_id found in localStorage')
          let redirectUrl: string
          if (isTesting) {
            redirectUrl = `${ORG_SETTINGS_URL}?ssotested=0&error=missing_organization_id`
          } else if (apiTokenData) {
            const tokenInfo = JSON.parse(apiTokenData)
            redirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?error=missing_organization_id' : '/user-settings/developers?error=missing_organization_id'
          } else {
            redirectUrl = `${LOGIN_URL}?error=missing_organization_id`
          }
          router.push(redirectUrl)
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
            let redirectUrl: string

            if (isTesting) {
              redirectUrl = `${ORG_SETTINGS_URL}?ssotested=1`
            } else if (apiTokenData) {
              const tokenInfo = JSON.parse(apiTokenData)
              redirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?token_authorized=1' : '/user-settings/developers?token_authorized=1'
            } else {
              redirectUrl = data.redirect_url || '/'
            }

            router.push(redirectUrl)
            return
          }

          let errorRedirectUrl: string
          if (isTesting) {
            errorRedirectUrl = `${ORG_SETTINGS_URL}?ssotested=0&error=sso_signin_failed`
          } else if (apiTokenData) {
            const tokenInfo = JSON.parse(apiTokenData)
            errorRedirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?error=sso_signin_failed' : '/user-settings/developers?error=sso_signin_failed'
          } else {
            errorRedirectUrl = `${LOGIN_URL}?error=sso_signin_failed`
          }
          router.push(errorRedirectUrl)
        } else {
          console.error('SSO callback failed:', data)
          let errorRedirectUrl: string
          if (isTesting) {
            errorRedirectUrl = `${ORG_SETTINGS_URL}?ssotested=0&error=sso_callback_failed`
          } else if (apiTokenData) {
            const tokenInfo = JSON.parse(apiTokenData)
            errorRedirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?error=sso_callback_failed' : '/user-settings/developers?error=sso_callback_failed'
          } else {
            errorRedirectUrl = `${LOGIN_URL}?error=sso_callback_failed`
          }
          router.push(errorRedirectUrl)
        }
      } catch (error) {
        console.error('SSO callback error:', error)
        let errorRedirectUrl: string
        if (isTesting) {
          errorRedirectUrl = `${ORG_SETTINGS_URL}?ssotested=0&error=sso_callback_error`
        } else if (apiTokenData) {
          const tokenInfo = JSON.parse(apiTokenData)
          errorRedirectUrl = tokenInfo.isOrg ? '/organization-settings/developers?error=sso_callback_error' : '/user-settings/developers?error=sso_callback_error'
        } else {
          errorRedirectUrl = `${LOGIN_URL}?error=sso_callback_error`
        }
        router.push(errorRedirectUrl)
      } finally {
        localStorage.removeItem('sso_organization_id')
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
