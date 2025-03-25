'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@repo/ui/logo'
import { useRouter } from 'next/navigation'
import { useAcceptOrganizationInvite } from '../../../lib/user'

export const InviteAccepter = () => {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const { data: session, update, status } = useSession()
  const { push } = useRouter()

  const hasUpdatedRef = useRef(false)

  const { isLoading, verified, error } = useAcceptOrganizationInvite(token ?? null)

  useEffect(() => {
    if (hasUpdatedRef.current) return

    if (status === 'unauthenticated' && session === null) {
      push(`/login?token=${token}`)
      return
    }

    if (verified && session) {
      hasUpdatedRef.current = true

      update({
        ...session,
        user: {
          ...session.user,
          accessToken: verified?.access_token,
          refreshToken: verified?.refresh_token,
          organization: verified?.joined_org_id,
        },
      }).then(() => {
        window.location.href = '/'
      })
    }
  }, [verified, session, status, push, token, hasUpdatedRef.current])

  return (
    <main className="flex flex-col min-h-screen w-full items-center space-between dark:bg-dk-surface-0 bg-surface-0">
      <div className="flex flex-col justify-center mx-auto my-auto w-full p-6 sm:w-1/3 h-full relative ease-in-out">
        <div className="mx-auto mb-3">
          <Logo width={200} />
        </div>
        {isLoading ? <h1 className="text-3xl text-center mt-4 animate-pulse">Accepting invite</h1> : null}
      </div>
    </main>
  )
}
