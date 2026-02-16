'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, CircleArrowRight, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { newsletterStyles } from './subscribe.styles'
import { recaptchaSiteKey } from '@repo/dally/auth'
import { CREATE_SUBSCRIBER } from '@repo/codegen/query/subscriber'
import { GraphQlResponseError } from '@/constants/graphQlResponseError'
import { extractGraphQlResponseError } from '@/utils/graphQlErrorMatcher'
import { SUPPORT_EMAIL } from '@/constants'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { Button } from '@repo/ui/button'

const formSchema = z.object({
  email: z.string().email(),
})

export const Subscribe = () => {
  const { wrapper, button } = newsletterStyles()

  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false)
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const subscribeToNewsletter = async (email: string) => {
    try {
      setIsPending(true)

      if (recaptchaSiteKey) {
        const recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'subscribe' })

        const recaptchaValidation = await fetch('/api/recaptchaVerify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
        })

        const validationResponse = await recaptchaValidation.json()
        if (!validationResponse.success) {
          console.error('reCAPTCHA validation failed.')
          return { success: false, message: 'reCAPTCHA validation failed.' }
        }
      }

      const res = await secureFetch('/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: CREATE_SUBSCRIBER,
          variables: { input: { email } },
        }),
      })

      if (!res.ok) {
        return { success: false, message: 'An error occurred while subscribing.' }
      }

      const graphQlCreateSubscriberError = await extractGraphQlResponseError(res)

      if (graphQlCreateSubscriberError && graphQlCreateSubscriberError === GraphQlResponseError.AlreadyExistsErrorCode) {
        setIsAlreadySubscribed(true)
      }

      if (graphQlCreateSubscriberError && graphQlCreateSubscriberError === GraphQlResponseError.MaxAttemptsErrorCode) {
        setMaxAttemptsReached(true)
      }

      return { success: true }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return { success: false, message: 'An error occurred while subscribing.' }
    } finally {
      setIsPending(false)
    }
  }

  const onSubmit = async ({ email }: z.infer<typeof formSchema>) => {
    const result = await subscribeToNewsletter(email)
    if (result.success) {
      setSubmitted(true)
    } else {
      form.setError('email', { message: result.message || 'Subscription failed' })
    }
  }

  return (
    <>
      {submitted ? (
        isAlreadySubscribed ? (
          <div className="flex items-center gap-4 px-4 py-3 border rounded-lg max-w-xl mx-auto bg-card">
            <div className="flex items-center justify-center w-7 h-7 rounded-full border ">
              <CheckCircle className="text-brand" size={37} />
            </div>
            <p className="text-sm leading-snug">You&apos;re on the list! Hang tight — we&apos;ll be in touch when it&apos;s your turn to try the beta.</p>
          </div>
        ) : maxAttemptsReached ? (
          <div className="flex items-center gap-4 px-4 py-3 border rounded-lg max-w-xl mx-auto bg-card">
            <div className="flex items-center justify-center w-7 h-7 rounded-full border ">
              <CheckCircle className="text-brand" size={37} />
            </div>
            <p className="text-sm leading-snug">
              You&apos;re on the list! We previously sent a confirmation to <span className="underline">{form.getValues('email')}</span>. If you haven&apos;t received the email, please reach out to{' '}
              <a href={SUPPORT_EMAIL} className="underline">
                support
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 py-3 border rounded-lg max-w-xl mx-auto bg-card">
            <div className="flex items-center justify-center w-7 h-7 rounded-full border ">
              <CheckCircle className="text-brand" size={37} />
            </div>
            <p className="text-sm leading-snug">
              You&apos;re on the list! We just sent a confirmation to <span className="underline">{form.getValues('email')}</span>. Hang tight — we&apos;ll be in touch when it&apos;s your turn to try
              the beta.
            </p>
          </div>
        )
      ) : (
        <div className="flex ">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={wrapper()}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <Input type="email" placeholder="Your work email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </>
                )}
              />
              <Button variant="primary" type="submit" className={button()} disabled={isPending}>
                <div className="flex items-center">
                  {isPending && <LoaderCircle className="animate-spin mr-2" size={16} />}
                  <span>{isPending ? 'Joining...' : 'Join the waitlist'}</span>
                </div>
                <CircleArrowRight size={16} />
              </Button>
            </form>
          </Form>
        </div>
      )}
    </>
  )
}
