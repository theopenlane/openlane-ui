'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { ArrowRightCircle, ShieldCheck } from 'lucide-react'
import { getSSORedirect } from '@/lib/auth/utils/get-openlane-token'
import { getCookie } from '@/lib/auth/utils/getCookie'
import { Loading } from '@/components/shared/loading/loading'

const SSOEnforcePage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)

  const email = searchParams?.get('email') || ''
  const organizationId = searchParams?.get('organization_id') || ''
  const hasError = !email || !organizationId || !!error

  useEffect(() => {
    const directOAuth = getCookie('direct_oauth')
    if (!directOAuth) {
      router.push('/login')
      return
    }

    // delete the cookie
    document.cookie = 'direct_oauth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'

    setIsValidating(false)
  }, [router])

  if (isValidating) {
    return (
      <div className="flex h-full w-full min-h-screen justify-center items-center">
        <Loading />
      </div>
    )
  }

  const handleSSOLogin = async () => {
    if (!email) {
      setError('Email not found')
      return
    }

    if (!organizationId) {
      setError('Organization ID not found')
      return
    }

    setLoading(true)

    try {
      const ssoConfig = await getSSORedirect(organizationId)

      if (!ssoConfig) {
        setError('Failed to get SSO redirect URL')
        setLoading(false)
        return
      }

      window.location.href = ssoConfig.redirect_uri
    } catch {
      setError('An error occurred during SSO login')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <ShieldCheck className="w-16 h-16 mx-auto text-brand mb-4" />
          <h1 className="text-2xl font-medium mb-2">Your organization requires SSO</h1>
          <p className="text-sm text-gray-600">To access your account, you need to sign in through your organization&apos;s single sign-on provider.</p>
          {email && (
            <p className="text-sm text-gray-500 mt-2">
              Email: <span className="font-medium">{email}</span>
            </p>
          )}
          {!email && <p className="text-sm text-red-600 mt-2">Email not found. Please try logging in again.</p>}
          {!organizationId && <p className="text-sm text-red-600 mt-2">Organization ID not found. Please try logging in again.</p>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 btn-secondary" onClick={handleSSOLogin} disabled={loading || hasError} size="lg">
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Redirecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Continue with SSO
                <ArrowRightCircle size={16} className="ml-2" />
              </div>
            )}
          </Button>

          {hasError && (
            <Button variant="outline" className="bg-unset" onClick={() => router.push('/login')} disabled={loading} size="lg">
              Back to login
            </Button>
          )}
        </div>

        {!hasError && (
          <button onClick={() => router.push('/login')} className="bg-unset text-sm text-gray-500 hover:text-gray-700 mt-4 block mx-auto" disabled={loading}>
            Back to login
          </button>
        )}
      </div>
    </div>
  )
}

export default SSOEnforcePage
