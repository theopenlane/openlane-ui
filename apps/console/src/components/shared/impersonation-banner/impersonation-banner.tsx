'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationNameById } from '@/lib/graphql-hooks/organization'
import { SUPPORT_LOGIN_URL } from '@/constants'

const ImpersonationBanner: React.FC = () => {
  const { data: session } = useSession()
  const { getOrganizationByID } = useOrganization()
  const isImpersonation = !!session?.user?.isImpersonation
  const orgId = session?.user?.activeOrganizationId
  const { data: orgData } = useGetOrganizationNameById(isImpersonation ? (orgId ?? undefined) : undefined)

  if (!isImpersonation) {
    return null
  }

  const fallbackOrg = getOrganizationByID(orgId)
  const orgName = orgData?.organization?.displayName || orgData?.organization?.name || fallbackOrg?.node?.displayName || fallbackOrg?.node?.name || orgId

  const stop = async () => {
    const sessionId = session?.user?.impersonationSessionId

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

    await signOut({ redirect: true, redirectTo: SUPPORT_LOGIN_URL })
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950">
      <span>
        Support session — acting as <strong>Openlane Support</strong> in <strong>{orgName}</strong>
        {orgName !== orgId ? <> ({orgId})</> : null}. You are working inside a customer account; every action is logged and audited.
      </span>
      <Button onClick={stop} variant="outline" className="h-7 px-3 py-0 border-amber-800 text-amber-950 hover:bg-amber-300 hover:text-amber-950 bg-amber-400">
        Exit support session
      </Button>
    </div>
  )
}

export default ImpersonationBanner
