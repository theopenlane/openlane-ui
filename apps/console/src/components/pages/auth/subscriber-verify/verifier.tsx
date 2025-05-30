'use client'

import { useSearchParams } from 'next/navigation'
import { LoaderCircle, SparklesIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { verificationStyles } from './page.styles'
import { Logo } from '@repo/ui/logo'

export const TokenVerifier = () => {
  const { errorMessage, successIcon, success, loading } = verificationStyles()

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`/api/subscriber-verify?token=${token}`)

          if (!response.ok) {
            setError('Verification failed. Please try again.')
          } else {
            setMessage('Verification successful')
          }
        } catch (err) {
          setError('An unexpected error occurred. Please try again.')
        }
      }
    }

    verifyToken()
  }, [token])

  if (!token) {
    return (
      <div className="flex flex-col m-auto self-center">
        <div className="mx-auto animate-pulse w-96">
          <Logo />
        </div>
        <div className={errorMessage()}>No token provided, please check your email for a verification link.</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col m-auto self-center">
        <div className="mx-auto animate-pulse w-96">
          <Logo />
        </div>
        <div className={errorMessage()}>{error}</div>
      </div>
    )
  }

  if (message) {
    return (
      <div className="flex flex-col m-auto self-center">
        <div className="mx-auto animate-pulse w-96">
          <Logo />
        </div>
        <div className={success()}>
          <div className="flex items-center justify-center gap-1">
            <SparklesIcon size={24} className={successIcon()} />
            <span className="mt-1">Thanks for confirming!</span>
          </div>
          <p> You’re on the list, and we’ll be reaching out as soon as your access is ready. Can’t wait to show you what we’ve been building.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col m-auto self-center">
      <div className="mx-auto animate-pulse w-96">
        <Logo />
      </div>
      <div className={loading()}>
        <LoaderCircle className="animate-spin" size={20} />
        <span>Verifying</span>
      </div>
    </div>
  )
}
