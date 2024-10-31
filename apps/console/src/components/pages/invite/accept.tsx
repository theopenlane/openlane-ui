
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@repo/ui/logo'
import { useRouter } from 'next/navigation'
import { useAcceptOrganizationInvite } from '../../../lib/user'

export const InviteAccepter = () => {
    const searchParams = useSearchParams()
    const { data: session, update } = useSession()
    const { push } = useRouter()
    const token = searchParams?.get('token')
  
    const { isLoading, verified, error } = useAcceptOrganizationInvite(token ?? null)
  
    useEffect(() => {
      const updateSession = async () => {
        if (verified && session) {
          await update({
            ...session,
            user: {
              ...session.user,
              accessToken: verified?.access_token,
              refreshToken: verified?.refresh_token,
              organization: verified?.joined_org_id,
            },
          })
  
          push('/dashboard')
        }
      }
  
      updateSession()
    }, [verified, error])
  
    return (
        <main className="flex flex-col min-h-screen w-full items-center space-between dark:bg-dk-surface-0 bg-surface-0">
          <div className="flex flex-col justify-center mx-auto my-auto w-full p-6 sm:w-1/3 h-full relative ease-in-out">
            <div className="mx-auto mb-3">
              <Logo width={200} />
            </div>
            {isLoading ? (
              <h1 className="text-3xl text-center mt-4 animate-pulse">
                Accepting invite
              </h1>
            ) : null}
          </div>
        </main>
    )
  }