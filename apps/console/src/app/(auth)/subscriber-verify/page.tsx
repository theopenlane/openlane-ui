'use client'

import { useSearchParams } from 'next/navigation'
import { LoaderCircle, WandSparklesIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { verificationStyles } from './page.styles'
import { Logo } from '@repo/ui/logo'

const VerifySubscriber: React.FC = () => {
  const { errorMessage, successMessage, successIcon, success, loading } =
  verificationStyles()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`/api/subscriber-verify?token=${token}`)
          const data = await response.json()

          console.log(response)

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
      <>
      <div className="mx-auto animate-pulse w-96">
      <Logo theme='dark' />
      </div>  
      <div className={errorMessage()}>
        No token provided, please check your email for a verification link.
      </div>
      </>
    )
  }

  if (error) {
    return ( 
    <>
    <div className="mx-auto animate-pulse w-96">
    <Logo theme='dark' />
    </div>  
    <div className={errorMessage()}>{error}</div>
    </>
    )
  }

  if (message) {
    return (
      <>
      <div className="mx-auto animate-pulse w-96">
          <Logo theme='dark' />
      </div>
      <div className={success()}>
        <WandSparklesIcon size={24} className={successIcon()} />
        <span className={successMessage()}>
          Thank you for subscribing. Your email is now verified.
        </span>
      </div>
      </>
    )
  }

  return (
    <>
    <div className="mx-auto animate-pulse w-96">
    <Logo theme='dark' />
    </div>    
    <div className={loading()}>
      <LoaderCircle className="animate-spin" size={20} />
      <span className={successMessage()}>Verifying</span>
    </div>
    </>
  )
}

export default VerifySubscriber
