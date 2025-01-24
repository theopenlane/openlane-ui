'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@repo/ui/button'
import { Form, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { useCreateSubscriberMutation } from '@repo/codegen/src/schema'
import { newsletterStyles } from './subscribe.styles'
import { recaptchaSiteKey } from '@repo/dally/auth'

const formSchema = z.object({
  email: z.string().email(),
})

export const Subscribe = () => {
  const { wrapper, input, button, errorMessage, success, successMessage, successIcon } = newsletterStyles()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  const subscribeToNewsletter = async (email: string) => {
    try {
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
          return {
            success: false,
            message: 'reCAPTCHA validation failed.',
          }
        }
      }

      const result = await addSubscriber({
        input: {
          email: email,
        },
      })

      return result
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return {
        success: false,
        message: 'An error occurred while subscribing.',
      }
    }
  }

  const onSubmit = ({ email }: z.infer<typeof formSchema>) => {
    subscribeToNewsletter(email)
  }

  // get the result and error from the mutation
  const [result, addSubscriber] = useCreateSubscriberMutation()
  const { data, error } = result

  const isLoading = result.fetching

  return (
    <>
      {data ? (
        <div className={success()}>
          <MailCheck size={24} className={successIcon()} />
          <span className={successMessage()}>Thank you for subscribing. Please check your email and click on the verification link to receive updates.</span>
        </div>
      ) : (
        <div className="flex justify-center">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={wrapper()}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <>
                    <FormControl>
                      <Input type="email" placeholder="Your email" className={input()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </>
                )}
              />
              <Button type="submit" className={button()}>
                {isLoading && <LoaderCircle className="animate-spin" size={20} />}
                {isLoading ? 'Loading' : 'Subscribe for updates'}
              </Button>
            </form>
            {error && <div className={errorMessage()}>{error.message}</div>}
          </Form>
        </div>
      )}
    </>
  )
}
