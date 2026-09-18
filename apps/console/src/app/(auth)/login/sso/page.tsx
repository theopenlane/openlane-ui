'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { getCookie } from '@/lib/auth/utils/getCookie'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import { clearSsoIntent, readSsoIntent, type SsoIntent } from '@/lib/auth/utils/sso-intent'

const ORG_SETTINGS_URL = '/organization-settings/authentication'
const LOGIN_URL = '/login'

const getRedirectUrl = (intent: SsoIntent | null, error?: string, isSuccess = false) => {
  const encodedError = encodeURIComponent(error ?? '')

  if (intent === 'test') {
    if (isSuccess) return `${ORG_SETTINGS_URL}?ssotested=1`
    return `${ORG_SETTINGS_URL}?ssotested=0&error=${encodedError}`
  }

  if (intent) {
    const basePath = intent === 'api' ? '/developers/api-tokens' : '/developers/personal-access-tokens'
    if (isSuccess) return `${basePath}?token_authorized=1`
    return `${basePath}?error=${encodedError}`
  }

  if (isSuccess) return '/'
  return `${LOGIN_URL}?error=${encodedError}`
}

const SSOCallbackPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackStartedRef = useRef(false)
  const { data: sessionData, status, update: updateSession } = useSession()

  useEffect(() => {
    const handleSSOCallback = async () => {
      const intent = readSsoIntent()

      try {
        const state = searchParams?.get('state')
        const code = searchParams?.get('code')

        if (!code || !state) {
          console.error('Missing required OAuth parameters')
          router.push(getRedirectUrl(intent, 'missing_oauth_params'))
          return
        }

        // check cookie or localstorage for the org id
        const organizationId = getCookie('organization_id')

        if (!organizationId) {
          router.push(getRedirectUrl(intent, 'missing_organization_id'))
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
            // we cannot inline this with the if branch above as this is already used for un-authenticated users already
            // else we won't be able to redirect them correctly
            if (sessionData) {
              await updateSession({
                user: {
                  ...sessionData.user,
                  accessToken: data.access_token,
                  activeOrganizationId: organizationId,
                  refreshToken: data.refresh_token,
                },
              })
            }

            const intentRedirect = getRedirectUrl(intent, undefined, true)
            router.push(intent ? intentRedirect : sanitizeLoginRedirect(data.redirect_url, intentRedirect))
            return
          }

          router.push(getRedirectUrl(intent, 'sso_signin_failed'))
        } else {
          // surface the server's explanation (e.g. authenticated successfully but not a member of the
          // organization) instead of a generic failure code so the login page can guide the user
          const reason = data?.message ? data.message : 'sso_callback_failed'
          router.push(getRedirectUrl(intent, reason))
        }
      } catch {
        router.push(getRedirectUrl(intent, 'sso_callback_error'))
      } finally {
        clearSsoIntent()
      }
    }

    if (status === 'loading' || callbackStartedRef.current) return

    callbackStartedRef.current = true
    handleSSOCallback()
  }, [router, searchParams, sessionData, status, updateSession])

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
