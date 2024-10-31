'use client'

import { useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Logo } from '@repo/ui/logo'
import { useVerifyUser } from '../../../lib/user'

export const TokenVerifier = () => {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const { isLoading, verified, error } = useVerifyUser(token ?? null)

  useEffect(() => {
    if (verified) {
      const accessToken = verified?.access_token
      const refreshToken = verified?.refresh_token

      signIn('credentials', {
        callbackUrl: '/dashboard',
        accessToken,
        refreshToken,
      })
    }
  }, [verified, error])

  return (
    <main className="flex flex-col min-h-screen w-full items-center space-between dark:bg-dk-surface-0 bg-surface-0">
      <div className="flex flex-col justify-center mx-auto my-auto w-full p-6 sm:w-1/3 h-full relative ease-in-out">
        <div className="mx-auto mb-3">
          <Logo width={200} />
        </div>
        {isLoading ? (
          <h1 className="text-3xl text-center mt-4 animate-pulse">
            Verifying your account...
          </h1>
        ) : null}
        {!isLoading && (
          <div>
            <h1 className="text-3xl text-center mt-4 text-oxford-blue-100" >
              Please check your email to verify your account.
            </h1>
          </div>
        )}
        <div className="mt-12">
          <Button
            className="mr-auto mt-2 w-full"
            onClick={() => {
              // TODO: Call resend email endpoint
            }}
            type="button"
          >
            Didn&apos;t get the email? Click here to resend.
          </Button>
        </div>
      </div>
    </main>
  )
}