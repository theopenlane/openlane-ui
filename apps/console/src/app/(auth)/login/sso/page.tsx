'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

const SSOCallbackPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSSOCallback = async () => {
      try {
        const state = searchParams?.get('state')
        const code = searchParams?.get('code')

        if (!code || !state) {
          console.error('Missing required OAuth parameters')
          router.push('/login?error=missing_oauth_params')
          return
        }

        const organizationId = localStorage.getItem('sso_organization_id')

        if (!organizationId) {
          console.error('No organization_id found in localStorage')
          router.push('/login?error=missing_organization_id')
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
          // Clear stored organization_id after successful SSO
          localStorage.removeItem('sso_organization_id')

          // Sign in with NextAuth using the SSO provider
          const signInResult = await signIn('credentials', {
            callbackUrl: data.redirect_url || '/',
            redirect: false, // Prevent automatic redirect
            // You might need to adjust this based on your NextAuth setup
            // The backend should return appropriate session data
          })

          if (signInResult && !signInResult.error) {
            router.push(data.redirect_url || '/')
          } else {
            router.push('/login?error=sso_signin_failed')
          }
        } else {
          // Clear stored organization_id on failure
          localStorage.removeItem('sso_organization_id')

          console.error('SSO callback failed:', data)
          router.push('/login?error=sso_callback_failed')
        }
      } catch (error) {
        // Clear stored organization_id on error
        localStorage.removeItem('sso_organization_id')

        console.error('SSO callback error:', error)
        router.push('/login?error=sso_callback_error')
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
