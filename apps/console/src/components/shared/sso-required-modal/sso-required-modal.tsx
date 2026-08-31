'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { ArrowRightCircle, ShieldCheck } from 'lucide-react'
import { getSSORedirect } from '@/lib/auth/utils/get-openlane-token'
import { type SSORequirement } from '@/lib/auth/utils/sso-required'

interface SSORequiredModalProps {
  requirement: SSORequirement | null
}

const SSORequiredModal = ({ requirement }: SSORequiredModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!requirement) {
      return
    }

    setLoading(true)
    setError(null)

    const ssoConfig = await getSSORedirect(requirement.organizationId)

    if (!ssoConfig) {
      setError('We could not start single sign-on. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = ssoConfig.redirect_uri
  }

  return (
    <Dialog open={!!requirement}>
      <DialogContent className="flex flex-col items-center justify-center gap-6 py-7 size-fit" showCloseButton={false}>
        <ShieldCheck className="w-12 h-12" strokeWidth={1} />
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Single sign-on required</h2>
          <p className="text-sm max-w-xs mx-auto">Your organization requires single sign-on. Sign in again with your identity provider to continue.</p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <Button variant="primary" onClick={handleContinue} disabled={loading}>
          {loading ? (
            'Redirecting...'
          ) : (
            <div className="flex items-center justify-center">
              Continue with SSO
              <ArrowRightCircle size={16} className="ml-2" />
            </div>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default SSORequiredModal
