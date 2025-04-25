'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CircleArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { Form, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { newsletterStyles } from './subscribe.styles'
import { recaptchaSiteKey } from '@repo/dally/auth'
import { CREATE_SUBSCRIBER } from '@repo/codegen/query/subscribe'

const formSchema = z.object({
  email: z.string().email(),
})

export const Subscribe = () => {
  const { wrapper, button, errorMessage, success, successMessage, successIcon } = newsletterStyles()

  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
        // @ts-ignore
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

      const res = await fetch('/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: CREATE_SUBSCRIBER,
          variables: { input: { email } },
        }),
      })

      const json = await res.json()
      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join('\n'))
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
        <div className={success()}>
          <MailCheck size={24} className={successIcon()} />
          <span className={successMessage()}>Thank you for subscribing. Please check your email and click on the verification link to receive updates.</span>
        </div>
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
                      <Input type="email" placeholder="Your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </>
                )}
              />
              <button type="submit" className={button()} disabled={isPending}>
                <div>
                  {isPending && <LoaderCircle className="animate-spin mr-2" size={20} />}
                  <span>{isPending ? 'Loading' : 'Join the waitlist'}</span>
                </div>
                <CircleArrowRight className="text-[#BCD9E1]" size={16} />
              </button>
            </form>
          </Form>
        </div>
      )}
    </>
  )
}
