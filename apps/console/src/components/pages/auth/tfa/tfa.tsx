'use client'

import React, { useState, useMemo } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { useNotification } from '@/hooks/useNotification'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

const TfaPage: React.FC = () => {
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: sessionData, update: updateSession } = useSession()
  const router = useRouter()
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
                onClick={() => {
                  setIsSecret(false)
                  setOtpValue('')
                  setError('')
                }}
                className="text-sm underline cursor-pointer text-accent-secondary"
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
                onClick={() => {
                  setIsSecret(true)
                  setOtpValue('')
                  setError('')
                }}
                className="text-sm underline cursor-pointer text-accent-secondary"
              >
                here
              </p>
              <p className="text-sm text-text-light">&nbsp;to enter the recovery code.</p>
            </>
          ),
        }
  }, [isSecret])

  const onVerified = async () => {
    if (!sessionData || !sessionData.user) {
      errorNotification({ title: 'Session is not available', variant: 'destructive' })
      return
    }

    await updateSession({
      ...sessionData,
      user: {
        ...sessionData.user,
        isTfaEnabled: false,
      },
    })

    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }

  const verifyOTP = async (otp: string) => {
    try {
      const payload = isSecret ? { recovery_code: otp } : { totp_code: otp }
      const response = await secureFetch('/api/verifyOTP', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onVerified()
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
        <InputOTP value={otpValue} maxLength={otpLength} onChange={handleOtpChange} containerClassName="gap-2">
          <InputOTPGroup className="text-text-light">
            {Array.from({ length: otpLength }).map((_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
        {error && <p className="text-error">{error}</p>}
        <div className="flex ">{config.bottomText}</div>
        {isSubmitting && <p className="text-sm text-text-light">Validating OTP...</p>}
      </div>
    </div>
  )
}

export default TfaPage
