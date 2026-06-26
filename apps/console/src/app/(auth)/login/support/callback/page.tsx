'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

const LOGIN_URL = '/login'

// SupportCallbackContent completes the second factor of the Openlane support access flow. The identity
// provider redirects here with a code and state; we exchange them for the support session token and
// establish an impersonated session.
const SupportCallbackContent: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSupportCallback = async () => {
      try {
        const state = searchParams?.get('state')
        const code = searchParams?.get('code')

        if (!code || !state) {
          router.push(`${LOGIN_URL}?error=missing_oauth_params`)
          return
        }

        const response = await fetch('/api/auth/support/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
          credentials: 'include',
        })

        const data = await response.json()

        if (response.ok && data.success && data.token) {
          const signInResult = await signIn('credentials', {
            accessToken: data.token,
            type: 'support',
            redirect: false,
          })

          if (signInResult && !signInResult.error) {
            router.push('/')
            return
          }

          router.push(`${LOGIN_URL}?error=support_signin_failed`)
        } else {
          router.push(`${LOGIN_URL}?error=support_callback_failed`)
        }
      } catch {
        router.push(`${LOGIN_URL}?error=support_callback_error`)
      }
    }

    handleSupportCallback()
  }, [router, searchParams])

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing Openlane support authentication...</p>
        <p className="text-sm text-gray-600 mt-2">Please wait while we start your support session.</p>
      </div>
    </div>
  )
}

const SupportCallbackPage: React.FC = () => (
  <Suspense>
    <SupportCallbackContent />
  </Suspense>
)

export default SupportCallbackPage
