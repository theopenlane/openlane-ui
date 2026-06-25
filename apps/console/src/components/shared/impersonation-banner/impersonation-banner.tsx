'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useOrganization } from '@/hooks/useOrganization'

// ImpersonationBanner renders a persistent, high-visibility banner whenever the active session is an
// impersonation (Openlane support) session. It makes the impersonated context unmistakable so staff do
// not confuse it with a normal session, showing the organization in scope and the acting individual.
const ImpersonationBanner: React.FC = () => {
  const { data: session } = useSession()
  const { getOrganizationByID } = useOrganization()

  if (!session?.user?.isImpersonation) {
    return null
  }

  const orgId = session.user.activeOrganizationId
  const org = getOrganizationByID(orgId)
  const orgName = org?.node?.displayName || org?.node?.name || orgId
  const impersonator = session.user.impersonator

  const stop = async () => {
    const sessionId = session.user.impersonationSessionId

    // revoke the support session server-side first so the token cannot be reused, then clear the local
    // session; revocation is best effort so a failure still logs the staff member out locally
    if (sessionId) {
      try {
        await fetch('/api/auth/impersonation/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, reason: 'support session ended by staff' }),
          credentials: 'include',
        })
      } catch {
        // best effort
      }
    }

    await signOut({ redirect: true, redirectTo: '/login' })
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <span>
        Support session — acting as <strong>Openlane Support</strong> in <strong>{orgName}</strong>
        {impersonator ? (
          <>
            {' '}
            by <strong>{impersonator}</strong>
          </>
        ) : null}
        . You are working inside a customer account; every action is logged and audited.
      </span>
      <Button onClick={stop} variant="outline" className="h-7 px-3 py-0">
        Exit support session
      </Button>
    </div>
  )
}

export default ImpersonationBanner
