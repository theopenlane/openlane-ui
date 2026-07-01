'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Logo } from '@repo/ui/logo'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { OPENLANE_WEBSITE_URL, SUPPORT_URL } from '@/constants'

// SSOInitiatePage is the public, shareable per-organization SSO entry point, e.g. /orgs/<slug>/sso. It
// mirrors GitHub's org SSO landing: a Continue action that starts the identity provider flow. The backend
// resolves the slug and sets the state/nonce/organization_id cookies, after which the identity provider
// redirects back to the existing /login/sso callback page to complete sign-in
const SSOInitiatePage: React.FC = () => {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!slug) {
      setError('This single sign-on link is missing an organization.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/sso/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.redirect_uri) {
        window.location.href = data.redirect_uri
        return
      }

      setError(data.message || "We couldn't start single sign-on for this organization.")
      setLoading(false)
    } catch {
      setError("We couldn't start single sign-on for this organization.")
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center bg-surface-0 dark:bg-dk-surface-0">
      <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 py-12">
        <Logo width={200} height={30} />
        <div className="shadow-md bg-card rounded-lg flex flex-col w-full py-10 px-10 border border-border">
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-lg font-bold">Authenticate with your organization</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll be redirected to your identity provider
              <br />
              to securely sign in.
            </p>
          </div>

          <Button variant="primary" className="w-full flex justify-center items-center h-10" onClick={handleContinue} disabled={loading} icon={<ArrowRight size={16} />}>
            {loading ? 'Redirecting…' : 'Continue with SSO'}
          </Button>

          {error && <p className="text-sm text-toast-error-icon mt-3 text-center">{error}</p>}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Having trouble? Contact your administrator or{' '}
          <Link href={`${SUPPORT_URL}`} className="underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500" target="_blank" rel="noopener noreferrer">
            Openlane support
          </Link>
        </p>

        <div className="text-xs opacity-90 flex gap-1 text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className="underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className="underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SSOInitiatePage
