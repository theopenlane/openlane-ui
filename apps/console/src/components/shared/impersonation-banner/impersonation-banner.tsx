'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useOrganization } from '@/hooks/useOrganization'

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

    if (sessionId) {
      try {
        await fetch('/api/auth/impersonation/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, reason: 'support session ended by staff' }),
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to revoke support session:', error)
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
