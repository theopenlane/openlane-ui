'use client'

import { useCreateTfaSetting, useUpdateTfaSetting } from '@/lib/graphql-hooks/tfa-setting'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { activatable } from '@repo/ui/lib/a11y'
import QRCodeDialog from '@/components/pages/protected/profile/user-settings/qrcode-dialog'
import React, { useState, useMemo, useRef } from 'react'
import { Button } from '@repo/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { useNotification } from '@/hooks/useNotification'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { buildLoginRedirect, sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'

type TfaLoginTokens = { access_token: string; refresh_token: string; session: string }

const TfaPage: React.FC<{ enrollment?: boolean }> = ({ enrollment = false }) => {
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSecret, setIsSecret] = useState(false)
  const [error, setError] = useState<string>('')
  const { errorNotification } = useNotification()
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null)
  const enrollmentTokensRef = useRef<TfaLoginTokens | null>(null)

  const { mutateAsync: createTfaSetting } = useCreateTfaSetting(enrollment)
  const { mutateAsync: updateTfaSetting } = useUpdateTfaSetting(enrollment)

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
                  setError('')
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
                  setError('')
                })}
                className="text-sm underline cursor-pointer text-primary"
              >
                here
              </p>
              <p className="text-sm text-text-light">&nbsp;to enter the recovery code.</p>
            </>
          ),
        }
  }, [isSecret])

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
      const result = await createTFARequest('/api/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!result) {
        return
      }
      const { response, data } = result

      if (response.ok && data.access_token && data.refresh_token && data.session) {
        await onVerified(data)
        return
      }

      setError('Invalid authentication token entered! Please use the token provided by your authentication app')
    } catch {
      errorNotification({ title: 'An error occurred' })
    }
  }

  const handleOtpChange = async (value: string) => {
    setOtpValue(value)
    setError('')

    if (value.length === otpLength) {
      setIsSubmitting(true)
      try {
        await verifyOTP(value)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const createTFARequest = async (url: string, options: RequestInit) => {
    const response = await secureFetch(url, options)

    const data = await response.json()

    if (response.status === 401) {
      const login = new URL(buildLoginRedirect(searchParams.get('redirect')), window.location.origin)
      login.searchParams.set('cleartfa', '1')
      login.searchParams.set('error', 'Your login attempt expired. Please sign in again.')
      router.replace(`${login.pathname}${login.search}`)

      return
    }

    return { response, data }
  }

  const handleEnrollment = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const data = await createTfaSetting({ input: { totpAllowed: true } })
      const setup = data.createTFASetting
      if (!setup.qrCode || !setup.tfaSecret) {
        throw new Error('Unable to load authenticator setup')
      }

      setSetup({ qrCode: setup.qrCode, secret: setup.tfaSecret })
    } catch (err) {
      setError(parseErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyEnrollment = async (otp: string): Promise<string[] | undefined> => {
    if (!enrollmentTokensRef.current) {
      const result = await createTFARequest('/api/auth/verify-totp', { method: 'POST', body: JSON.stringify({ totp_code: otp }) })
      if (!result) {
        return
      }
      const { response, data } = result
      if (!response.ok || !data.access_token || !data.refresh_token || !data.session) {
        throw new Error(data.message || 'Unable to complete verification')
      }
      enrollmentTokensRef.current = { access_token: data.access_token, refresh_token: data.refresh_token, session: data.session }
    }

    const data = await updateTfaSetting({ input: { verified: true } })
    const codes = data.updateTFASetting.recoveryCodes
    if (!codes?.length) {
      throw new Error('Unable to retrieve recovery codes. Please retry.')
    }

    return codes
  }

  if (enrollment) {
    return (
      <div className="flex flex-col self-center m-auto max-w-lg gap-6 p-6">
        <h1 className="text-3xl text-center">Set up two-factor authentication</h1>
        <p>Your organization requires two-factor authentication (2FA). Set it up below to continue working with your team.</p>
        <Button onClick={handleEnrollment} disabled={isSubmitting}>
          Set up authenticator
        </Button>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {setup && (
          <QRCodeDialog
            qrcode={setup.qrCode}
            secret={setup.secret}
            regeneratedCodes={null}
            onVerify={verifyEnrollment}
            onComplete={async () => {
              if (!enrollmentTokensRef.current || isSubmitting) {
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
            }}
            onClose={() => {
              const login = new URL(buildLoginRedirect(searchParams.get('redirect')), window.location.origin)
              login.searchParams.set('cleartfa', '1')
              router.push(`${login.pathname}${login.search}`)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col self-center m-auto">
      <h1 className="text-3xl mb-20 text-text-light">Two-Factor Authentication</h1>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-text-light">{config.title}</p>
        <InputOTP key={otpLength} autoFocus value={otpValue} maxLength={otpLength} onChange={handleOtpChange} containerClassName="gap-2">
          <InputOTPGroup className="text-text-light">
            {Array.from({ length: otpLength }).map((_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex ">{config.bottomText}</div>
        {isSubmitting && <p className="text-sm text-text-light">Validating OTP...</p>}
      </div>
    </div>
  )
}

export default TfaPage
