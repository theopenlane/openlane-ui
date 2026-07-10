'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'
import { Logo } from '@repo/ui/logo'
import { ArrowRight, Headphones } from 'lucide-react'

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
    <div className="flex h-full w-full min-h-screen justify-center items-center bg-surface-0 dark:bg-dk-surface-0">
      <div className="flex flex-col items-center gap-6 w-full max-w-xl px-4 py-12">
        <Logo width={200} height={30} />

        <div className="shadow-md bg-card rounded-lg flex flex-col w-full py-10 px-10 border border-border">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Headphones className="text-primary" size={24} />
            </div>
            <h1 className="text-lg font-bold">Openlane support access</h1>
            <p className="text-sm text-muted-foreground mt-1">Authenticate with your support identity, then verify with the Openlane identity provider</p>
          </div>

          {error && <p className="text-sm text-toast-error-icon mb-4 text-center">{error}</p>}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Support Identity</label>
              <Input type="email" variant="light" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-transparent" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm">Support Password</label>
              <PasswordInput variant="light" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-transparent !text-text" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm">Organization ID</label>
              <Input variant="light" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} placeholder="Organization to access" required className="bg-transparent" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm">Reason</label>
              <Input
                variant="light"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for accessing this organization (min 10 characters)"
                required
                minLength={10}
                className="bg-transparent"
              />
            </div>

            <Button variant="primary" type="submit" disabled={submitting} className="w-full flex justify-center items-center h-10 mt-2" icon={<ArrowRight size={16} />}>
              {submitting ? 'Starting…' : 'Continue to identity provider'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SupportLoginPage
