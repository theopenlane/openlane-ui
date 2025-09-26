'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@repo/ui/logo'
import { useAcceptOrganizationInvite } from '../../../lib/user'
import Link from 'next/link'
import { Button } from '@repo/ui/button'

export const InviteAccepter = () => {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const { data: session, update, status } = useSession()
  const { push } = useRouter()

  const hasUpdatedRef = useRef(false)
  const [enabled, setEnabled] = useState(false)

  const { isLoading, verified } = useAcceptOrganizationInvite(token ?? null, enabled)

  useEffect(() => {
    if (status === 'authenticated' && token) {
      setEnabled(true)
    } else if (status === 'unauthenticated') {
      push(`/login?token=${token}`)
    }
  }, [status, token, push])

  useEffect(() => {
    if (hasUpdatedRef.current || !verified?.success || !session) return

    hasUpdatedRef.current = true

    const expires = new Date(Date.now() + 5 * 60 * 1000).toUTCString()
    document.cookie = `direct_oauth=true; path=/; expires=${expires}; SameSite=Lax`

    update({
      ...session,
      user: {
        ...session.user,
        accessToken: verified?.access_token,
        refreshToken: verified?.refresh_token,
        organization: verified?.joined_org_id,
        isOnboarding: false,
      },
    }).then(() => {
      window.location.href = `/login/sso/enforce?email=${session.user?.email}&organization_id=${verified.joined_org_id}`
    })
  }, [verified, session, update])

  const showError = verified && !verified.success

  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center dark:bg-dk-surface-0 bg-surface-0">
      <div className="flex flex-col justify-center mx-auto w-full p-6 sm:w-1/3 h-full relative">
        <div className="mx-auto mb-6">
          <Logo width={200} />
        </div>

        {isLoading && <h1 className="text-3xl text-center mt-4 animate-pulse">Accepting invite...</h1>}

        {showError && (
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold text-red-600">Invite not found</h2>
            <p className="mt-2 text-sm">Looks like that invite link’s invalid or expired. Reach out to the person who sent it and ask them to send you a new one.</p>
            <Link href="/dashboard" className="mt-4 block">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
