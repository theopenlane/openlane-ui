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
import { UNSUBSCRIBE_MUTATION } from '@repo/codegen/query/subscriber'
import { Panel } from '@repo/ui/panel'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

const formSchema = z.object({
  email: z.string().email(),
})

const UnsubscribeForm = () => {
  const [isPending, setIsPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
      form.setValue('email', email)
    }
  }, [params, form])

  const handleUnsubscribe = async (email: string) => {
    setIsPending(true)
    try {
      const res = await secureFetch('/api/graphql', {
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
        throw new Error(json.errors.map((e: { message: string }) => e.message).join('\n'))
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
        <h2 className="text-xl font-bold">You&apos;ve Been Unsubscribed</h2>
        <p className="mt-2">We&apos;re sorry to see you go — but we get it.</p>
        <p>You&apos;ve been removed from our mailing list and won&apos;t receive any further updates.</p>
        <p>If you want to rejoin, you&apos;re always welcome.</p>
        <p className="mt-2">Thanks for being part of Openlane — we wish you all the best.</p>
      </div>
    )
  }

  return (
    <>
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
    </>
  )
}

export default UnsubscribeForm
