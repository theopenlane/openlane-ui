'use client'

import { useSearchParams } from 'next/navigation'
import { CircleCheckBig, CircleX, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { verificationStyles } from './page.styles'
import { Logo } from '@repo/ui/logo'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import Link from 'next/link'
import Linkedin from '@/assets/Linkedin'
import Discord from '@/assets/Discord'
import Github from '@/assets/Github'
import { Button } from '@repo/ui/button'

export const TokenVerifier = () => {
  const { messageWrapper, loading } = verificationStyles()

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`/api/subscriber-verify?token=${token}`)

          if (!response.ok) {
            setError('Verification failed. Please try again.')
          } else {
            setIsVerified(true)
          }
        } catch {
          setError('An unexpected error occurred. Please try again.')
        }
      }
    }

    verifyToken()
  }, [token])

  if (!token) {
    return (
      <div className="flex flex-col m-auto self-center z-1">
        <div className="mx-auto animate-pulse w-96 flex justify-center">
          <Logo width={213} />
        </div>
        <div className={messageWrapper()}>
          <TriangleAlert size={37} className="text-warning" strokeWidth={1.5} />
          <p className="text-sm">No token provided, please check your email for a verification link.</p>
        </div>
        <Button className="size-fit mt-4 mx-auto mb-5">Request a new one</Button>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col m-auto self-center">
        <div className="mx-auto animate-pulse w-96">
          <Logo width={213} />
        </div>
        <div className={messageWrapper()}>
          <CircleX size={37} className="text-destructive" strokeWidth={1.5} />
          <div>
            <p>{error}</p>
            <p>If you continue to have issues, please reach out to our support team.</p>
          </div>
        </div>
        <Button className="size-fit mt-4 mx-auto mb-5">Send email to support team</Button>
        <Footer />
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="flex flex-col m-auto self-center z-1">
        <div className="mx-auto animate-pulse w-96 flex justify-center">
          <Logo width={213} />
        </div>
        <div className={messageWrapper()}>
          <CircleCheckBig size={37} className="text-brand" strokeWidth={1.5} />
          <p className="text-sm">
            Thank you for subscribing. Your email is now verified. <br /> We’ll let you know when Openlane is ready!
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col m-auto self-center">
      <div className="mx-auto animate-pulse w-96">
        <Logo width={213} />
      </div>
      <div className={loading()}>
        <LoaderCircle className="animate-spin" size={20} />
        <span>Verifying</span>
      </div>
    </div>
  )
}

const Footer = () => {
  return (
    <div className="relative z-10 w-full md:max-w-lg self-start">
      <div className="flex flex-col md:flex-row gap-3 mt-10 items-center justify-center">
        {/* GitHub */}
        <a href="https://github.com/theopenlane" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px] ">
          <Github size={30} />
          <div className="flex flex-col text-left text-sm leading-tight gap-1">
            <span>GitHub</span>
            <span className="text-blue-500">@theopenlane</span>
          </div>
        </a>

        {/* Discord */}
        <a href="https://discord.gg/4fq2sxDk7D" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px] ">
          <Discord size={30} />
          <div className="flex flex-col text-left text-sm leading-tight gap-1">
            <span>Discord</span>
            <span className="text-blue-500">Join community</span>
          </div>
        </a>

        {/* LinkedIn */}
        <a href="https://www.linkedin.com/company/theopenlane" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg border bg-card w-[162px] ">
          <Linkedin size={30} />
          <div className="flex flex-col text-left text-sm leading-tight gap-1">
            <span>LinkedIn</span>
            <span className="text-blue-500">@theopenlane</span>
          </div>
        </a>
      </div>

      <div className="mt-8 md:mt-12 text-xs space-x-4 flex justify-center ">
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`}>Privacy Policy</Link>
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`}>Terms of Service</Link>
      </div>
    </div>
  )
}
