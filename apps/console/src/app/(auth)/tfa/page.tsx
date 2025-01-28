'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { toast } from '@repo/ui/use-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TfaPage = () => {
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: sessionData, update: updateSession } = useSession()
  const router = useRouter()
  const [isTfaVerified, setIsTfaVerified] = useState(false)
  const [isSecret, setIsSecret] = useState(false)

  const otpLength = isSecret ? 8 : 6

  const config = useMemo(() => {
    return isSecret
      ? {
          title: 'Enter the secret key provided during setup.',
          bottomText: (
            <>
              <p className="text-sm">Want to go back to authenticator? Click&nbsp;</p>
              <p
                onClick={() => {
                  setIsSecret(false)
                  setOtpValue('')
                }}
                className="text-sm underline cursor-pointer text-accent-secondary"
              >
                here
              </p>
              <p className="text-sm">&nbsp;to enter the OTP instead.</p>
            </>
          ),
        }
      : {
          title: `Please enter the ${otpLength}-digit OTP sent to your authenticator app.`,
          bottomText: (
            <>
              <p className="text-sm">Don't have access to your app? Click&nbsp;</p>
              <p
                onClick={() => {
                  setIsSecret(true)
                  setOtpValue('')
                }}
                className="text-sm underline cursor-pointer text-accent-secondary"
              >
                here
              </p>
              <p className="text-sm">&nbsp;to enter the secret key.</p>
            </>
          ),
        }
  }, [isSecret, otpLength])

  const onVerified = async () => {
    if (!sessionData || !sessionData.user) {
      toast({ title: 'Session is not available', variant: 'destructive' })
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
    }, 2000)

    setIsTfaVerified(true)
  }

  const verifyOTP = async (otp: string) => {
    try {
      const payload = isSecret ? { recovery_code: otp } : { totp_code: otp }
      const response = await fetch('/api/verifyOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: 'OTP validated successfully', variant: 'success' })
        onVerified()
      } else {
        toast({ title: 'OTP validation failed', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error during OTP validation:', error)
      toast({ title: 'An error occurred', variant: 'destructive' })
    }
  }

  const handleOtpChange = async (value: string) => {
    setOtpValue(value)

    if (value.length === otpLength) {
      setIsSubmitting(true)
      try {
        await verifyOTP(value)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (isTfaVerified) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h3>Verified! Redirecting...</h3>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm">{config.title}</p>
      <InputOTP value={otpValue} maxLength={otpLength} onChange={handleOtpChange} containerClassName="gap-2">
        <InputOTPGroup>
          {Array.from({ length: otpLength }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
        <InputOTPSeparator />
      </InputOTP>
      <div className="flex">{config.bottomText}</div>
      {isSubmitting && <p className="text-sm text-gray-500">Validating OTP...</p>}
    </div>
  )
}

export default TfaPage
