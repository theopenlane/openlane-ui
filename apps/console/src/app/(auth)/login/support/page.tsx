'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'

// SupportLoginPage is the first factor of the Openlane support access flow. Support staff authenticate
// the shared support identity with its configured password and choose the organization to access; the
// backend then redirects to the configured identity provider for the second factor, which identifies
// the individual staff member.
const SupportLoginPage: React.FC = () => {
  const [email, setEmail] = useState('support@theopenlane.io')
  const [password, setPassword] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          target_organization_id: organizationId,
          reason,
        }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.redirect_uri) {
        window.location.href = data.redirect_uri
        return
      }

      setError(data.message || 'Support login failed')
    } catch {
      setError('Could not start support login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full w-full min-h-screen justify-center items-center">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">Openlane Support Access</h1>
          <p className="text-sm text-gray-600 mt-1">Authenticate the support identity, then verify with your Openlane identity provider.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium">Support identity</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Support password</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Organization ID</label>
          <Input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} placeholder="organization to access" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason for accessing the organization (min 10 characters)" required minLength={10} />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Starting…' : 'Continue to identity provider'}
        </Button>
      </form>
    </div>
  )
}

export default SupportLoginPage
