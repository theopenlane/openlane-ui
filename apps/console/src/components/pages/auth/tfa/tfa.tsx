'use client'

import { activatable } from '@repo/ui/lib/a11y'
import React, { useState, useMemo } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { useNotification } from '@/hooks/useNotification'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { buildLoginRedirect, sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'

const TfaPage: React.FC = () => {
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSecret, setIsSecret] = useState(false)
  const [error, setError] = useState<string>('')
  const { errorNotification } = useNotification()

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

  const onVerified = async (data: { access_token: string; refresh_token: string; session: string }) => {
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
      const response = await secureFetch('/api/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (response.status === 401) {
        const login = new URL(buildLoginRedirect(searchParams?.get('redirect')), window.location.origin)
        login.searchParams.set('error', 'Your login attempt expired. Please sign in again.')
        router.replace(`${login.pathname}${login.search}`)
        return
      }

      if (response.ok && data.access_token && data.refresh_token && data.session) {
        await onVerified(data)
      } else {
        setError('Invalid authentication token entered! Please use the token provided by your authentication app')
      }
    } catch (error) {
      console.error('Error during OTP validation:', error)
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
