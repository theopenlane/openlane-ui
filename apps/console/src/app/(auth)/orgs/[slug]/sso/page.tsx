'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'

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

      setError(data.message || 'We couldn’t start single sign-on for this organization.')
      setLoading(false)
    } catch {
      setError('We couldn’t start single sign-on for this organization.')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Single sign-on</h1>
        <p className="text-sm text-gray-600 mb-6">Continue to sign in to {slug} with your organization’s identity provider.</p>

        <Button onClick={handleContinue} disabled={loading}>
          {loading ? 'Redirecting…' : 'Continue'}
        </Button>

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  )
}

export default SSOInitiatePage
