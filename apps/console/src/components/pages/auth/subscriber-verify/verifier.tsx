'use client'

import { useSearchParams } from 'next/navigation'
import { CircleArrowRight, CircleCheckBig, CircleX, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { verificationStyles } from './page.styles'
import { Logo } from '@repo/ui/logo'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import Link from 'next/link'
import Linkedin from '@/assets/Linkedin'
import Discord from '@/assets/Discord'
import Github from '@/assets/Github'
import { Button } from '@repo/ui/button'
import { Form, FormControl, FormField, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { z } from 'zod'
import { CREATE_SUBSCRIBER } from '@repo/codegen/query/subscribe'
import { extractGraphQlResponseError } from '@/utils/graphQlErrorMatcher'
import { GraphQlResponseError } from '@/constants/graphQlResponseError'
import { useNotification } from '@/hooks/useNotification'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z.object({
  email: z.string().email(),
})

export const TokenVerifier = () => {
  const { messageWrapper, loading } = verificationStyles()

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')

  // Show/hide the “Request a new one” form
  const [showResubscribeForm, setShowResubscribeForm] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Once they successfully subscribe, store the email here
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  const subscribeToNewsletter = async (email: string) => {
    try {
      setIsPending(true)

      const res = await fetch('/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: CREATE_SUBSCRIBER,
          variables: { input: { email } },
        }),
      })

      const graphQlCreateSubscriberError = await extractGraphQlResponseError(res)
      if (graphQlCreateSubscriberError && graphQlCreateSubscriberError === GraphQlResponseError.MaxAttemptsErrorCode) {
        errorNotification({
          title: 'Subscription failed',
          description: 'Too many attempts',
        })
        return { success: false }
      }

      return { success: true }
    } catch {
      return { success: false, message: 'An error occurred while subscribing.' }
    } finally {
      setIsPending(false)
    }
  }

  const onSubmit = async ({ email }: z.infer<typeof formSchema>) => {
    const result = await subscribeToNewsletter(email)

    if (result.success) {
      // 1) show a toast
      successNotification({
        title: 'Subscribed!',
        description: 'We just sent a confirmation to your inbox.',
      })
      // 2) record the email and hide the form
      setSubmittedEmail(email)
      setShowResubscribeForm(false)
      form.reset() // optional: clear the input
    } else {
      errorNotification({
        title: 'Subscription failed',
        description: result.message || 'An unexpected error occurred.',
      })
    }
  }

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

  // ---------- RENDERING ----------

  // 1) No token provided
  if (!token) {
    return (
      <div className="flex flex-col m-auto self-center z-1 relative">
        <div className="mx-auto animate-pulse w-96 flex justify-center">
          <Logo width={213} />
        </div>

        <div className={messageWrapper()}>
          <TriangleAlert size={37} className="text-warning" strokeWidth={1.5} />
          <p className="text-sm">{submittedEmail ? `We sent an email confirmation to ${submittedEmail}.` : 'No token provided, please check your email for a verification link.'}</p>
        </div>

        {!submittedEmail && ( // Only show “Request a new one” if user hasn't just subscribed
          <>
            {!showResubscribeForm ? (
              <Button className="size-fit mt-4 mx-auto mb-5" onClick={() => setShowResubscribeForm(true)}>
                Request a new one
              </Button>
            ) : (
              <div className="flex justify-center mt-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center gap-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <>
                          <FormControl>
                            <Input type="email" placeholder="Your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </>
                      )}
                    />

                    <button type="submit" disabled={isPending} className="p-4 text-button-text bg-brand justify-between items-center rounded-md text-sm h-10 font-bold flex gap-1">
                      <div className="flex items-center">
                        {isPending && <LoaderCircle className="animate-spin mr-2" size={16} />}
                        <span>{isPending ? 'Rejoining...' : 'Rejoin the waitlist'}</span>
                      </div>
                      <CircleArrowRight size={16} />
                    </button>
                  </form>
                </Form>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>
    )
  }

  // 2) Token exists but verification failed
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

  // 3) Token exists and isVerified is true
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

  // 4) While verifying
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
        <a href="https://github.com/theopenlane" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px]">
          <Github size={30} />
          <div className="flex flex-col text-left text-sm leading-tight gap-1">
            <span>GitHub</span>
            <span className="text-blue-500">@theopenlane</span>
          </div>
        </a>

        {/* Discord */}
        <a href="https://discord.gg/4fq2sxDk7D" target="_blank" rel="noopener noreferrer" className="bg-card flex items-center gap-3 px-2.5 py-1.5 rounded-lg border w-[162px]">
          <Discord size={30} />
          <div className="flex flex-col text-left text-sm leading-tight gap-1">
            <span>Discord</span>
            <span className="text-blue-500">Join community</span>
          </div>
        </a>

        {/* LinkedIn */}
        <a href="https://www.linkedin.com/company/theopenlane" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-2.5 py-1.5 rounded-lg border bg-card w-[162px]">
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
