'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Form, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { LoaderCircle, MailCheck } from 'lucide-react'
import { UNSUBSCRIBE_MUTATION } from '@repo/codegen/query/subscribe'
import { Logo } from '@repo/ui/logo'
import { Panel } from '@repo/ui/panel'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email(),
})

const UnsubscribeForm = () => {
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [autoEmail, setAutoEmail] = useState('')
  const params = useSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    const email = params.get('email')
    if (email) {
      setAutoEmail(email)
      form.setValue('email', email)
    }
  }, [params])

  const handleUnsubscribe = async (email: string) => {
    setIsPending(true)
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: UNSUBSCRIBE_MUTATION,
          variables: {
            email,
            input: { unsubscribed: true },
          },
        }),
      })

      const json = await res.json()
      if (json.errors?.length) {
        throw new Error(json.errors.map((e: any) => e.message).join('\n'))
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Unsubscribe error:', err)
      form.setError('email', { message: 'Failed to unsubscribe' })
    } finally {
      setIsPending(false)
    }
  }

  const onSubmit = async ({ email }: z.infer<typeof formSchema>) => {
    handleUnsubscribe(email)
  }

  if (submitted) {
    return (
      <div className="text-center p-6 border rounded-md bg-oxford-blue-950 text-white">
        <MailCheck className="mx-auto mb-4" size={32} />
        <h2 className="text-xl font-bold">You’ve Been Unsubscribed</h2>
        <p className="mt-2">We’re sorry to see you go — but we get it.</p>
        <p>You’ve been removed from our mailing list and won’t receive any further updates.</p>
        <p>If you want to rejoin, you're always welcome.</p>
        <p className="mt-2">Thanks for being part of Openlane — we wish you all the best.</p>
      </div>
    )
  }

  return (
    <main className="flex items-center justify-center h-screen relative">
      <div className="w-full relative z-3 px-4">
        <div className="mx-auto animate-pulse w-96">
          <Logo theme="dark" />
        </div>

        <Panel className="flex flex-col border w-full shadow-3xl rounded-lg border-border py-4 px-40 gap-6 items-stretch justify-start text-left mt-10 bg-oxford-blue-950 border-none text-neutral-300">
          <h2 className="text-2xl text-center">Unsubscribe</h2>
          <div className="flex flex-col text-center">
            We’re sorry to see you go — but we get it.
            <br />
            Enter your email below to stop receiving updates from us.
          </div>
        </Panel>
        <div className="relative w-72 mt-14 flex flex-col gap-5 justify-center m-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
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
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <LoaderCircle className="animate-spin mr-2" size={20} />}
                {isPending ? 'Processing...' : 'Unsubscribe'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="flex flex-col text-center text-sm mt-20">
          <Link href="/login">Back to login</Link>
        </div>
        <div className="text-[10px] text-gray-500 mt-5 text-center">
          This site is protected by reCAPTCHA and the Google{' '}
          <a className="text-blue-500 underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a className="text-blue-500 underline" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{' '}
          apply.
        </div>
      </div>
    </main>
  )
}

export default UnsubscribeForm
