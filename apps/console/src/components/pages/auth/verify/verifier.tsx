'use client'

import { useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Logo } from '@repo/ui/logo'
import { useVerifyUser } from '@/lib/user'
import { verificationStyles } from './page.styles'
import { buttonVariants } from '@repo/ui/components/plate-ui/button.tsx'

export const TokenVerifier = () => {
  const { successMessage, button, success, content, logo, wrapper, verifying } = verificationStyles()

  const router = useRouter()
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
        session: verified.session,
      })
    }
  }, [verified, error])

  return (
    <main className={content()}>
      <div className={wrapper()}>
        <div className={logo()}>
          <Logo width={300} theme="dark" />
        </div>
        {isLoading ? <h1 className={verifying()}>Verifying your account...</h1> : null}
        {!isLoading && (
          <div className={success()}>
            <span className={successMessage()}>
              Thank you for signing up for Openlane! <br />
              <br />
              Check your email and give that awesome verification link a click to get started.
            </span>
          </div>
        )}
        <div className={button()}>
          <Button
            className={buttonVariants({ size: 'lg', variant: 'ghost' })}
            onClick={() => {
              router.push('/resend-verify')
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
