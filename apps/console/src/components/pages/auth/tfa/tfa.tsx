'use client'

import { useStartTfaEnrollment, useUpdateTfaSetting } from '@/lib/graphql-hooks/tfa-setting'
import { useVerifyTotp, type TfaLoginTokens } from '@/lib/query-hooks/tfa'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { activatable } from '@repo/ui/lib/a11y'
import QRCodeDialog from '@/components/pages/protected/profile/user-settings/qrcode-dialog'
import React, { useState, useMemo, useRef } from 'react'
import { Button } from '@repo/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { useNotification } from '@/hooks/useNotification'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildLoginRedirect, sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import { FormMessage } from '@repo/ui/form'

const TfaPage: React.FC<{ enrollment?: boolean }> = ({ enrollment = false }) => {
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSecret, setIsSecret] = useState(false)
  const { errorNotification } = useNotification()
  const enrollmentTokensRef = useRef<TfaLoginTokens | null>(null)

  const { mutate: startEnrollment, data: setup, error: enrollmentError, isPending: isStartingEnrollment } = useStartTfaEnrollment()

  const { mutateAsync: verifyTotp, error: verificationError, isPending: isVerifying, reset: resetVerification } = useVerifyTotp()

  const { mutateAsync: updateTfaSetting } = useUpdateTfaSetting(enrollment)

  const error = enrollmentError ? parseErrorMessage(enrollmentError) : verificationError?.message
  const isPending = isSubmitting || isStartingEnrollment || isVerifying

  const otpLength = isSecret ? 8 : 6

  const config = useMemo(() => {
    return isSecret
      ? {
          title: 'Enter a recovery code. Please note recovery codes can only be used once. ',
          bottomText: (
            <>
              <p className="text-sm text-text-light">Want to go back to authenticator? Click&nbsp;</p>
              <p
                {...activatable(() => {
                  setIsSecret(false)
                  setOtpValue('')
                  resetVerification()
                })}
                className="text-sm underline cursor-pointer text-primary"
              >
                here
              </p>
              <p className="text-sm">&nbsp;to enter the app code instead.</p>
            </>
          ),
        }
      : {
          title: `Enter an authenticator app code: `,
          bottomText: (
            <>
              <p className="text-sm text-text-light">Don&apos;t have access to your app? Click&nbsp;</p>
              <p
                {...activatable(() => {
                  setIsSecret(true)
                  setOtpValue('')
                  resetVerification()
                })}
                className="text-sm underline cursor-pointer text-primary"
              >
                here
              </p>
              <p className="text-sm text-text-light">&nbsp;to enter the recovery code.</p>
            </>
          ),
        }
  }, [isSecret, resetVerification])

  const onVerified = async (data: TfaLoginTokens) => {
    const result = await signIn('credentials', {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      session: data.session,
      redirect: false,
    })

    if (result?.error || !result?.ok) {
      router.push('/login?cleartfa=1')
      return
    }

    router.replace(sanitizeLoginRedirect(searchParams?.get('redirect'), '/dashboard'))
  }

  const verifyOTP = async (otp: string) => {
    try {
      const payload = isSecret ? { recovery_code: otp } : { totp_code: otp }
      const data = await verifyTotp(payload)
      if (data) {
        await onVerified(data)
      }
    } catch {
      errorNotification({ title: 'An error occurred' })
    }
  }

  const handleOtpChange = async (value: string) => {
    if (isPending) {
      return
    }
    setOtpValue(value)
    resetVerification()

    if (value.length === otpLength) {
      setIsSubmitting(true)
      try {
        await verifyOTP(value)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleEnrollment = () => {
    enrollmentTokensRef.current = null
    resetVerification()
    startEnrollment()
  }

  const verifyEnrollment = async (otp: string): Promise<string[] | undefined> => {
    if (!enrollmentTokensRef.current) {
      const data = await verifyTotp({ totp_code: otp })
      if (!data) {
        return
      }
      enrollmentTokensRef.current = data
    }

    const data = await updateTfaSetting({ input: { verified: true } })
    const codes = data.updateTFASetting.recoveryCodes
    if (!codes?.length) {
      throw new Error('Unable to retrieve recovery codes. Please retry.')
    }

    return codes
  }

  const handleEnrollmentCompletion = async () => {
    if (!enrollmentTokensRef.current || isPending) {
      return
    }

    setIsSubmitting(true)

    try {
      await onVerified(enrollmentTokensRef.current)
    } catch (error) {
      errorNotification({ title: 'Unable to complete sign in', description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseEnrollment = () => {
    const login = new URL(buildLoginRedirect(searchParams.get('redirect')), window.location.origin)
    login.searchParams.set('cleartfa', '1')
    router.push(`${login.pathname}${login.search}`)
  }

  if (enrollment) {
    return (
      <div className="flex flex-col self-center m-auto max-w-lg gap-6 p-6">
        <h1 className="text-3xl text-center">Set up two-factor authentication</h1>
        <p>Your organization requires two-factor authentication (2FA). Set it up below to continue working with your team.</p>
        <Button onClick={handleEnrollment} disabled={isPending}>
          Set up authenticator
        </Button>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {setup && (
          <QRCodeDialog qrcode={setup.qrCode} secret={setup.secret} regeneratedCodes={null} onVerify={verifyEnrollment} onComplete={handleEnrollmentCompletion} onClose={handleCloseEnrollment} />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col self-center m-auto">
      <h1 className="text-3xl mb-20 text-text-light">Two-Factor Authentication</h1>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-text-light">{config.title}</p>
        <InputOTP key={otpLength} autoFocus value={otpValue} maxLength={otpLength} onChange={handleOtpChange} disabled={isPending} containerClassName="gap-2">
          <InputOTPGroup className="text-text-light">
            {Array.from({ length: otpLength }).map((_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
        <FormMessage>{error}</FormMessage>
        <div className="flex ">{config.bottomText}</div>
        {isPending && <p className="text-sm text-text-light">Validating OTP...</p>}
      </div>
    </div>
  )
}

export default TfaPage
